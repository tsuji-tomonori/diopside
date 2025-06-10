"""Production environment stack."""

from typing import Any

from constructs import Construct

from .base_stack import BaseStack


class ProdStack(BaseStack):
    """Production environment stack with prod-specific configurations."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs: Any,
    ) -> None:
        """Initialize the production stack.
        
        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, environment="prod", **kwargs)
        
        # Production-specific configurations can be added here
        # For example, longer log retention, higher memory allocation, etc.