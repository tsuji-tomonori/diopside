import { Button, Card, CardBody } from '@heroui/react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900">
      {/* ヘッダー */}
      <header className="w-full p-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-[#6E3FE7] mb-4">
          白雪巴ファンサイト
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          過去のアーカイブを楽しく閲覧しよう
        </p>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 年度別アーカイブ */}
          <Card className="hover-scale cursor-pointer">
            <CardBody className="text-center p-8">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">年度別アーカイブ</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                年度ごとに整理されたアーカイブを閲覧
              </p>
              <Link href="/archives/yearly">
                <Button 
                  color="primary" 
                  variant="flat"
                  className="w-full"
                >
                  閲覧する
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* タグ別アーカイブ */}
          <Card className="hover-scale cursor-pointer">
            <CardBody className="text-center p-8">
              <div className="text-4xl mb-4">🏷️</div>
              <h3 className="text-xl font-semibold mb-2">タグ別アーカイブ</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                階層構造のタグで動画を探索
              </p>
              <Link href="/archives/tags">
                <Button 
                  color="primary" 
                  variant="flat"
                  className="w-full"
                >
                  探索する
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* 神経衰弱ゲーム */}
          <Card className="hover-scale cursor-pointer">
            <CardBody className="text-center p-8">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold mb-2">神経衰弱ゲーム</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                サムネイルで神経衰弱を楽しもう
              </p>
              <Link href="/game/memory">
                <Button 
                  color="primary" 
                  variant="flat"
                  className="w-full"
                >
                  プレイする
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* ランダム再生 */}
          <Card className="hover-scale cursor-pointer">
            <CardBody className="text-center p-8">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-semibold mb-2">ランダム再生</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                ランダムにアーカイブを発見
              </p>
              <Link href="/random">
                <Button 
                  color="primary" 
                  variant="flat"
                  className="w-full"
                >
                  発見する
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>

        {/* 統計情報 */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardBody className="p-8">
              <h2 className="text-2xl font-semibold mb-6">アーカイブ統計</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-[#6E3FE7]">0</div>
                  <div className="text-gray-600 dark:text-gray-400">総動画数</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#6E3FE7]">0</div>
                  <div className="text-gray-600 dark:text-gray-400">タグ数</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#6E3FE7]">0</div>
                  <div className="text-gray-600 dark:text-gray-400">総再生時間</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>

      {/* フッター */}
      <footer className="w-full p-6 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2024 Diopside - 白雪巴ファンサイト</p>
      </footer>
    </div>
  );
}
