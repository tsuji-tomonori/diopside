"""WAF stack using construct pattern."""

from typing import Any, Self

import aws_cdk as cdk
from construct import Construct

from construct.waf import WafConstruct


class WafStack(cdk.Stack):
    """WAF stack containing CloudFront WebACL (us-east-1 only)."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize WAF stack.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = environment

        # Create WAF construct
        self.waf = WafConstruct(
            self,
            "Waf",
            environment=environment,
        )
