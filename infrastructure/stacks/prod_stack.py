"""Production environment stack."""

from typing import Any

from construct import Construct

from .base_stack import BaseStack


class ProdStack(BaseStack):
    """Production environment stack with prod-specific configurations."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        web_acl_arn: str | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize the production stack.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            web_acl_arn: WebACL ARN from WAF stack (optional)
            **kwargs: Additional keyword arguments
        """
        super().__init__(
            scope, construct_id, environment="prod", web_acl_arn=web_acl_arn, **kwargs
        )

        # Production-specific configurations can be added here
        # For example, longer log retention, higher memory allocation, etc.
