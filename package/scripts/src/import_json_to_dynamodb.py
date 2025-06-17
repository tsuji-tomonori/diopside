"""JSONファイルからDynamoDBへレコードをインポートするスクリプト"""

import glob
import json
import os
from datetime import datetime
from typing import Any, Dict, List

import boto3
from botocore.exceptions import ClientError

try:
    from dateutil import parser
except ImportError:
    print(
        "Error: python-dateutil package is required. Install it with: pip install python-dateutil"
    )
    exit(1)


class CloudFormationHelper:
    """CloudFormationスタックからリソース情報を取得するヘルパークラス"""

    def __init__(self, region: str = "ap-northeast-1"):
        self.cf_client = boto3.client("cloudformation", region_name=region)

    def get_stack_outputs(self, stack_name: str) -> Dict[str, str]:
        """CloudFormationスタックのOutputsを取得"""
        try:
            response = self.cf_client.describe_stacks(StackName=stack_name)
            stacks = response["Stacks"]

            if not stacks:
                raise ValueError(f"Stack {stack_name} not found")

            outputs = {}
            for output in stacks[0].get("Outputs", []):
                outputs[output["OutputKey"]] = output["OutputValue"]

            return outputs
        except ClientError as e:
            raise RuntimeError(f"Failed to get stack outputs: {e}")

    def get_table_name_from_arn(self, table_arn: str) -> str:
        """DynamoDB ARNからテーブル名を抽出"""
        # ARN形式: arn:aws:dynamodb:region:account:table/table-name
        return table_arn.split("/")[-1]

    def get_dynamodb_table_name(self, stack_name: str) -> str:
        """CloudFormationスタックからDynamoDBテーブル名を取得"""
        outputs = self.get_stack_outputs(stack_name)

        # TableArn output を探す
        table_arn = None
        for key, value in outputs.items():
            if "TableArn" in key or ("Table" in key and "Arn" in key):
                table_arn = value
                break

        if not table_arn:
            raise ValueError(f"TableArn not found in stack {stack_name} outputs")

        return self.get_table_name_from_arn(table_arn)


class JsonToDynamoDBImporter:
    """JSONファイルからDynamoDBへのインポートを行うクラス"""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)

    def scan_json_files(self, metadata_dir: str = "metadata") -> List[str]:
        """metadata/配下のJSONファイルを検索"""
        pattern = os.path.join(metadata_dir, "*.json")
        return glob.glob(pattern)

    def load_json_data(self, file_path: str) -> List[Dict[str, Any]]:
        """JSONファイルからデータを読み込み"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in file {file_path}: {e}")
        except FileNotFoundError:
            raise FileNotFoundError(f"File not found: {file_path}")

    def extract_year_from_published_at(self, published_at: str) -> int:
        """published_atから年を抽出"""
        try:
            dt = parser.isoparse(published_at)
            return dt.year
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid published_at format: {published_at}. Error: {e}")

    def generate_thumbnail_url(self, video_id: str) -> str:
        """YouTube video IDからサムネイルURLを生成"""
        return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"

    def transform_to_dynamodb_record(
        self, json_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """JSONレコードをDynamoDB形式に変換"""
        video_id = json_record["video_id"]
        published_at = json_record["published_at"]
        year = self.extract_year_from_published_at(published_at)
        now = datetime.utcnow().isoformat() + "Z"

        # DynamoDBレコード形式（アーキテクチャドキュメントに従い）
        record = {
            "PK": f"YEAR#{year}",
            "SK": f"VIDEO#{video_id}",
            "video_id": video_id,
            "title": json_record["title"],
            "tags": json_record.get("tags", []),
            "year": year,
            "thumbnail_url": self.generate_thumbnail_url(video_id),
            "created_at": published_at,  # 元の公開日時を使用
            "updated_at": now,
        }

        # GSI用のTag属性も追加（タグベース検索用）
        if record["tags"]:
            record["Tag"] = record["tags"][0]

        return record

    def batch_write_records(self, records: List[Dict[str, Any]]):
        """DynamoDBにバッチ書き込み（25件ずつ）"""
        batch_size = 25

        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]

            with self.table.batch_writer() as writer:
                for record in batch:
                    writer.put_item(Item=record)

    def import_file(self, file_path: str) -> Dict[str, Any]:
        """単一ファイルをインポート"""
        try:
            print(f"Processing file: {file_path}")
            json_data = self.load_json_data(file_path)

            if not json_data:
                return {
                    "file": file_path,
                    "success": True,
                    "imported_count": 0,
                    "error": "Empty file",
                }

            records = []
            for item in json_data:
                try:
                    record = self.transform_to_dynamodb_record(item)
                    records.append(record)
                except Exception as e:
                    print(f"Warning: Skipping invalid record in {file_path}: {e}")
                    continue

            if records:
                self.batch_write_records(records)

            return {
                "file": file_path,
                "success": True,
                "imported_count": len(records),
                "error": None,
            }

        except Exception as e:
            return {
                "file": file_path,
                "success": False,
                "imported_count": 0,
                "error": str(e),
            }

    def import_all_files(self, metadata_dir: str = "metadata") -> Dict[str, Any]:
        """全JSONファイルをインポート"""
        json_files = self.scan_json_files(metadata_dir)

        if not json_files:
            return {
                "total_files": 0,
                "total_imported": 0,
                "results": [],
                "error": f"No JSON files found in {metadata_dir}",
            }

        results = []
        total_imported = 0

        print(f"Found {len(json_files)} JSON files")

        for file_path in json_files:
            result = self.import_file(file_path)
            results.append(result)

            if result["success"]:
                total_imported += result["imported_count"]

        return {
            "total_files": len(json_files),
            "total_imported": total_imported,
            "results": results,
        }


def main():
    """メイン実行関数"""
    import argparse

    parser = argparse.ArgumentParser(description="Import JSON files to DynamoDB")
    parser.add_argument(
        "--stack-name",
        default="DevDiopsideApp",
        help="CloudFormation stack name (default: DevDiopsideApp)",
    )
    parser.add_argument(
        "--region",
        default="ap-northeast-1",
        help="AWS region (default: ap-northeast-1)",
    )
    parser.add_argument(
        "--metadata-dir",
        default="metadata",
        help="Metadata directory path (default: metadata)",
    )

    args = parser.parse_args()

    try:
        print(
            f"Resolving DynamoDB table name from CloudFormation stack: {args.stack_name}"
        )

        # CloudFormationからテーブル名を取得
        cf_helper = CloudFormationHelper(region=args.region)
        table_name = cf_helper.get_dynamodb_table_name(args.stack_name)

        print(f"Found DynamoDB table: {table_name}")
        print(f"Processing directory: {args.metadata_dir}")

        # インポート実行
        importer = JsonToDynamoDBImporter(table_name)
        results = importer.import_all_files(args.metadata_dir)

        print("\nIMPORT COMPLETED")
        print(f"Total files processed: {results['total_files']}")
        print(f"Total records imported: {results['total_imported']}")

        if results.get("error"):
            print(f"Error: {results['error']}")

        print("\nDETAILS:")
        for result in results["results"]:
            status = "✓" if result["success"] else "✗"
            print(f"{status} {result['file']}: {result['imported_count']} records")
            if result["error"]:
                print(f"  Error: {result['error']}")

    except Exception as e:
        print(f"Fatal error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
