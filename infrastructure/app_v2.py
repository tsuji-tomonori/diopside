#!/usr/bin/env python3
"""AWS CDK App entry point for 白雪巴 VTuber fan site infrastructure (refactored)."""

from typing import Any

import aws_cdk as cdk
from aws_cdk import Tags

from stacks.main_stack import MainStack
from stacks.waf_stack_v2 import WafStack


def add_name_tag(scope: Any) -> None:  # noqa: ANN401
    """Add Name tags to all resources recursively."""
    for child in scope.node.children:
        if cdk.Resource.is_resource(child):
            Tags.of(child).add("Name", child.node.path.replace("/", "-"))
        add_name_tag(child)


def main() -> None:
    """Main entry point for CDK application."""
    app = cdk.App()

    # Project configuration
    project_name = "shirayuki-tomo-fansite"
    account = app.node.try_get_context("account")

    # WAF stacks (must be in us-east-1 for CloudFront)
    dev_waf_stack = WafStack(
        app,
        f"{project_name}-dev-waf",
        environment="dev",
        env=cdk.Environment(
            account=account,
            region="us-east-1",
        ),
    )

    prod_waf_stack = WafStack(
        app,
        f"{project_name}-prod-waf",
        environment="prod",
        env=cdk.Environment(
            account=account,
            region="us-east-1",
        ),
    )

    # Main application stacks
    dev_stack = MainStack(
        app,
        f"{project_name}-dev",
        environment="dev",
        env=cdk.Environment(
            account=account,
            region="ap-northeast-1",
        ),
    )
    dev_stack.add_dependency(dev_waf_stack)

    prod_stack = MainStack(
        app,
        f"{project_name}-prod",
        environment="prod",
        env=cdk.Environment(
            account=account,
            region="ap-northeast-1",
        ),
    )
    prod_stack.add_dependency(prod_waf_stack)

    # Add common tags
    Tags.of(app).add("Project", project_name)
    Tags.of(app).add("ManagedBy", "cdk")
    
    # Add environment-specific tags
    Tags.of(dev_waf_stack).add("Environment", "dev")
    Tags.of(dev_stack).add("Environment", "dev")
    Tags.of(prod_waf_stack).add("Environment", "prod")
    Tags.of(prod_stack).add("Environment", "prod")
    
    # Add Name tags to all resources
    add_name_tag(app)

    app.synth()


if __name__ == "__main__":
    main()