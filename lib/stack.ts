import * as path from "path";

import { Arn, Construct, Stack, StackProps } from "@aws-cdk/core";
import { Function, Code, Runtime } from "@aws-cdk/aws-lambda";
import { Rule } from "@aws-cdk/aws-events";
import { LambdaFunction } from "@aws-cdk/aws-events-targets";
import { Secret } from "@aws-cdk/aws-secretsmanager";
import { PolicyStatement } from "@aws-cdk/aws-iam";

export class CodepipelineGithubStatusBotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const secretName = "outschool/cdk/githubAccessToken";

    const lambda = new Function(this, "Function", {
      runtime: Runtime.NODEJS_12_X,
      code: Code.fromAsset(path.join(__dirname, "../src/")),
      handler: "index.handler",
      environment: {
        GITHUB_ACCESS_TOKEN_SECRET_NAME: secretName,
      },
    });

    if (!lambda.role) {
      throw new Error("Lambda has no execution role, this should not happen");
    }

    lambda.role.addToPolicy(
      new PolicyStatement({
        actions: ["codepipeline:GetPipelineExecution"],
        resources: ["*"],
      })
    );

    const secret = Secret.fromSecretArn(
      this,
      "Secret",
      Arn.format(
        {
          service: "secretsmanager",
          resource: "secret",
          sep: ":",
          resourceName: `${secretName}*`,
        },
        this
      )
    );

    secret.grantRead(lambda.role);

    new Rule(this, "Rule", {
      eventPattern: {
        source: ["aws.codepipeline"],
        detailType: ["CodePipeline Stage Execution State Change"],
      },
      targets: [new LambdaFunction(lambda)],
    });
  }
}
