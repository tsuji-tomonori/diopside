#!/usr/bin/env python3
"""AWS CDK App entry point for 白雪巴 VTuber fan site infrastructure."""

import aws_cdk as cdk

from stacks.dev_stack import DevStack
from stacks.prod_stack import ProdStack


def main() -> None:
    """Main entry point for CDK application."""
    app = cdk.App()

    # Development environment
    DevStack(
        app,
        "ShirayukiTomoFansiteDevStack",
        env=cdk.Environment(
            account=app.node.try_get_context("account"),
            region="ap-northeast-1",
        ),
        tags={
            "Project": "shirayuki-tomo-fansite",
            "Environment": "dev",
            "Owner": "openhands",
        },
    )

    # Production environment
    ProdStack(
        app,
        "ShirayukiTomoFansiteProdStack",
        env=cdk.Environment(
            account=app.node.try_get_context("account"),
            region="ap-northeast-1",
        ),
        tags={
            "Project": "shirayuki-tomo-fansite",
            "Environment": "prod",
            "Owner": "openhands",
        },
    )

    app.synth()


if __name__ == "__main__":
    main()