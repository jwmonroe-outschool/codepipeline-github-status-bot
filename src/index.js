"use strict";

const AWS = require("aws-sdk");
const axios = require("axios");

const GITHUB_BASE_URL = "https://api.github.com/repos";

const CodePipeline = new AWS.CodePipeline();
const SecretsManager = new AWS.SecretsManager();

let GITHUB_ACCESS_TOKEN;

exports.handler = async (event) => {
  const region = event.region;
  const pipelineName = event.detail.pipeline;
  const executionId = event.detail["execution-id"];
  const state = transformState(event.detail.state);

  if (state === null) {
    return;
  }

  const result = await CodePipeline.getPipelineExecution({
    pipelineName: pipelineName,
    pipelineExecutionId: executionId,
  }).promise();

  const artifactRevision = result.pipelineExecution.artifactRevisions[0];

  const revisionURL = artifactRevision.revisionUrl;
  const sha = artifactRevision.revisionId;

  const pattern = /github.com\/(.+)\/(.+)\/commit\//;
  const [, owner, repository] = pattern.exec(revisionURL);

  const payload = createPayload(pipelineName, region, state);
  await postStatusToGitHub(owner, repository, sha, payload);

  return null;
};

function transformState(state) {
  if (state === "SUCCEEDED") {
    return "success";
  }
  if (state === "STARTED" || state === "RESUMED") {
    return "pending";
  }
  if (state === "FAILED" || state === "CANCELED" || state === "SUPERSEDED") {
    return "failure";
  }
  return null;
}

function createPayload(pipelineName, region, status) {
  let description;
  if (status === "pending") {
    description = "Build started";
  } else if (status === "success") {
    description = "Build succeeded";
  } else if (status === "failure") {
    description = "Build failed!";
  }

  return {
    state: status,
    target_url: buildCodePipelineUrl(pipelineName, region),
    description: description,
    context: "cdk/CodePipeline",
  };
}

function buildCodePipelineUrl(pipelineName, region) {
  return `https://${region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipelineName}/view?region=${region}`;
}

async function postStatusToGitHub(owner, repository, sha, payload) {
  if (!GITHUB_ACCESS_TOKEN) {
    const secretResponse = await SecretsManager.getSecretValue({
      SecretId: process.env.GITHUB_ACCESS_TOKEN_SECRET_NAME,
    }).promise();
    GITHUB_ACCESS_TOKEN = secretResponse.SecretString;
  }

  const url = `/${owner}/${repository}/statuses/${sha}`;

  const config = {
    baseURL: GITHUB_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    auth: {
      password: GITHUB_ACCESS_TOKEN,
    },
  };

  await axios.post(url, payload, config);
}
