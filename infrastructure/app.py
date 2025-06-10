#!/usr/bin/env python3
"""AWS CDK App entry point for 白雪巴 VTuber fan site infrastructure."""

import aws_cdk as cdk

from stacks.dev_stack import DevStack
from stacks.prod_stack import ProdStack
from stacks.waf_stack import WafStack


def main() -> None:
    """Main entry point for CDK application."""
    app = cdk.App()

    # WAF stacks (must be in us-east-1 for CloudFront)
    dev_waf_stack = WafStack(
        app,
        "ShirayukiTomoFansiteDevWafStack",
        environment="dev",
        env=cdk.Environment(
            account=app.node.try_get_context("account"),
            region="us-east-1",
        ),
        tags={
            "Project": "shirayuki-tomo-fansite",
            "Environment": "dev",
            "Owner": "openhands",
        },
    )

    prod_waf_stack = WafStack(
        app,
        "ShirayukiTomoFansiteProdWafStack",
        environment="prod",
        env=cdk.Environment(
            account=app.node.try_get_context("account"),
            region="us-east-1",
        ),
        tags={
            "Project": "shirayuki-tomo-fansite",
            "Environment": "prod",
            "Owner": "openhands",
        },
    )

    # Development environment
    dev_stack = DevStack(
        app,
        "ShirayukiTomoFansiteDevStack",
        web_acl_arn=cdk.Fn.import_value("WebACLArn-dev"),
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
    dev_stack.add_dependency(dev_waf_stack)

    # Production environment
    prod_stack = ProdStack(
        app,
        "ShirayukiTomoFansiteProdStack",
        web_acl_arn=cdk.Fn.import_value("WebACLArn-prod"),
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
    prod_stack.add_dependency(prod_waf_stack)

    app.synth()


if __name__ == "__main__":
    main()