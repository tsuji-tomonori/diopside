#!/usr/bin/env python3
"""AWS CDK App entry point for 白雪巴 VTuber fan site infrastructure."""

import aws_cdk as cdk

from stacks.main_stack import MainStack


def main() -> None:
    """Main entry point for CDK application."""
    app = cdk.App()

    # Single main stack (no separate dev/prod environments)
    main_stack = MainStack(
        app,
        "ShirayukiTomoFansiteStack",
        env=cdk.Environment(
            account=app.node.try_get_context("account"),
            region="ap-northeast-1",
        ),
        tags={
            "Project": "shirayuki-tomo-fansite",
            "Owner": "openhands",
        },
    )

    app.synth()


if __name__ == "__main__":
    main()