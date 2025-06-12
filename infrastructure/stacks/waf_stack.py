"""WAF stack for CloudFront (must be deployed in us-east-1)."""

from typing import Any

import aws_cdk as cdk
from aws_cdk import aws_ssm as ssm, aws_wafv2 as wafv2
from constructs import Construct


class WafStack(cdk.Stack):
    """WAF stack containing CloudFront WebACL (us-east-1 only)."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str,
        **kwargs: Any,
    ) -> None:
        """Initialize the WAF stack.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            **kwargs: Additional keyword arguments (including cross_region_references)
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = environment

        # Create WAF for CloudFront
        self.web_acl = self._create_waf()

        # Store WebACL ARN in SSM Parameter for cross-region access
        ssm.StringParameter(
            self,
            f"WebACLArnParameter{self.env_name.title()}",
            parameter_name=f"/shirayuki-tomo-fansite/{self.env_name}/waf/webacl-arn",
            string_value=self.web_acl.attr_arn,
            description=f"WebACL ARN for {self.env_name} environment",
        )

        # Also export for same-region access (backward compatibility)
        cdk.CfnOutput(
            self,
            f"WebACLArn{self.env_name.title()}",
            value=self.web_acl.attr_arn,
            export_name=f"WebACLArn-{self.env_name}",
            description=f"WebACL ARN for {self.env_name} environment",
        )

    def _create_waf(self) -> wafv2.CfnWebACL:
        """Create WAF for basic web attack protection."""
        waf = wafv2.CfnWebACL(
            self,
            "WebACL",
            scope="CLOUDFRONT",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            rules=[
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

        # Add Name tag
        cdk.Tags.of(waf).add("Name", f"shirayuki-tomo-fansite-waf-{self.env_name}")

        return waf
