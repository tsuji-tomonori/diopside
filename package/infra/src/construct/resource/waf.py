"""WAF construct for CloudFront protection."""

from typing import Any, Literal, Self

import aws_cdk as cdk
from aws_cdk import aws_ssm as ssm
from aws_cdk import aws_wafv2 as wafv2
from constructs import Construct
from src.model.env import Env


class WafConstruct(Construct):
    """WAF construct for CloudFront protection."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: Env,
        web_acl_scope: Literal["REGIONAL", "CLOUDFRONT"],
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize WAF construct.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env = environment

        # Create WAF WebACL
        self.web_acl = wafv2.CfnWebACL(
            self,
            "WebACL",
            scope=web_acl_scope,
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            rules=[
                # AWS Managed Rules - Common Rule Set
                wafv2.CfnWebACL.RuleProperty(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet",
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        sampled_requests_enabled=True,
                        cloud_watch_metrics_enabled=True,
                        metric_name="CommonRuleSetMetric",
                    ),
                ),
                # AWS Managed Rules - Known Bad Inputs Rule Set
                wafv2.CfnWebACL.RuleProperty(
                    name="AWSManagedRulesKnownBadInputsRuleSet",
                    priority=2,
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesKnownBadInputsRuleSet",
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        sampled_requests_enabled=True,
                        cloud_watch_metrics_enabled=True,
                        metric_name="KnownBadInputsRuleSetMetric",
                    ),
                ),
            ],
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name="WebACLMetric",
            ),
        )

        self.web_acl_arn = self.web_acl.attr_arn

        # Output WebACL ARN
        cdk.CfnOutput(
            self,
            "WebACLArn",
            value=self.web_acl.attr_arn,
            description=f"WebACL ARN for {self.env} environment",
        )
