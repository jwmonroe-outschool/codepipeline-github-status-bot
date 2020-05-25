import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CodepipelineGithubStatusBot from '../lib/codepipeline-github-status-bot-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CodepipelineGithubStatusBot.CodepipelineGithubStatusBotStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
