import { SynthUtils } from "@aws-cdk/assert";
import { App } from "@aws-cdk/core";
import { CodepipelineGithubStatusBotStack } from "../lib/stack";

test("it should match the latest snapshot", () => {
  const app = new App();
  const stack = new CodepipelineGithubStatusBotStack(app, "MyTestStack");
  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
