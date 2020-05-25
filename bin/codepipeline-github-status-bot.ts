#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CodepipelineGithubStatusBotStack } from '../lib/codepipeline-github-status-bot-stack';

const app = new cdk.App();
new CodepipelineGithubStatusBotStack(app, 'CodepipelineGithubStatusBotStack');
