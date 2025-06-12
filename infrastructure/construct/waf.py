"""WAF construct for CloudFront protection."""

from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_ssm as ssm, aws_wafv2 as wafv2
from construct import Construct


class WafConstruct(Construct):
    """WAF construct for CloudFront protection."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: str,
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

        self.env_name = environment

        # Create WAF WebACL
        self.web_acl = self._create_web_acl()

        # Store WebACL ARN in SSM Parameter for cross-region access
        self.ssm_parameter = ssm.StringParameter(
            self,
            "WebACLArnParameter",
            parameter_name=f"/shirayuki-tomo-fansite/{self.env_name}/waf/webacl-arn",
            string_value=self.web_acl.attr_arn,
            description=f"WebACL ARN for {self.env_name} environment",
        )

        # Output WebACL ARN
        cdk.CfnOutput(
            self,
            "WebACLArn",
            value=self.web_acl.attr_arn,
            description=f"WebACL ARN for {self.env_name} environment",
        )

    def _create_web_acl(self: Self) -> wafv2.CfnWebACL:
        """Create WAF WebACL with security rules."""
        web_acl = wafv2.CfnWebACL(
            self,
            "WebACL",
            scope="CLOUDFRONT",
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

        # Add Name tag
        cdk.Tags.of(web_acl).add("Name", f"shirayuki-tomo-fansite-waf-{self.env_name}")

        return web_acl
