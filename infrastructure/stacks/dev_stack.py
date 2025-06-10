"""Development environment stack."""

from typing import Any

from constructs import Construct

from .base_stack import BaseStack


class DevStack(BaseStack):
    """Development environment stack with dev-specific configurations."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs: Any,
    ) -> None:
        """Initialize the development stack.
        
        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, environment="dev", **kwargs)
        
        # Development-specific configurations can be added here
        # For example, shorter log retention, different scaling settings, etc.