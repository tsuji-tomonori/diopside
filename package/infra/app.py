import aws_cdk as cdk
from src.model.env import Env
from src.model.project import Project
from src.stack.app_stack import AppStack
from src.stack.waf_stack import FrontEndWafStack


def add_name_tag(scope):  # noqa: ANN001, ANN201
    """Recursively add 'Name' tag to all resources in the scope."""
    for child in scope.node.children:
        if cdk.Resource.is_resource(child):
            cdk.Tags.of(child).add("Name", child.node.path.replace("/", "-"))
        add_name_tag(child)


# Initialize the CDK application
app = cdk.App()

# Define the project metadata
project = Project()
env = Env.DEV


front_waf = FrontEndWafStack(
    scope=app,
    construct_id=f"{env.camel_case}{project.camel_case_name}FrontWaf",
    project=project,
    environment=env,
    env=cdk.Environment(
        region="us-east-1",
    ),
    # cross_region_references=True,
)

AppStack(
    scope=app,
    construct_id=f"{env.camel_case}{project.camel_case_name}App",
    project=project,
    environment=env,
    env=cdk.Environment(
        region="ap-northeast-1",
    ),
    # web_acl_arn=front_waf.waf.web_acl_arn,
    # web_acl_arn="arn:aws:wafv2:us-east-1:123456789012:global/webacl/diopside-front-waf/12345678-1234-1234-1234-123456789012",
    # cross_region_references=True,
)

cdk.Tags.of(app).add("Project", project.name)
cdk.Tags.of(app).add("Environment", env.name)
cdk.Tags.of(app).add("ManagedBy", "cdk")
add_name_tag(app)
app.synth()
