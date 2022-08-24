const core = require('@actions/core');
const github = require('@actions/github');
const npa = require('npm-package-arg');
const installPreset = require('./installPreset');
const validateTitle = require('./validateTitle');

async function run() {
  try {
    let successState = core.getInput('success-state');
    let config = core.getInput('config');
    let failureState = core.getInput('failure-state');
    const installPresetPackage = core.getInput('preset');
    const requirePresetPackage = npa(installPresetPackage).name;

    const contextPullRequest = github.context.payload.pull_request;
    if (!contextPullRequest) {
      throw new Error(
        "This action can only be invoked in `pull_request` events. Otherwise the pull request can't be inferred."
      );
    }
    try {
      config =  JSON.parse(config);
    } catch(e) {
      config = {};
    }

    let error = null;
    try {
      await installPreset(installPresetPackage);
      await validateTitle(requirePresetPackage, contextPullRequest.title, config);
    } catch (err) {
      error = err;
    }

    core.setOutput('success', (error === null).toString());

    let state = 'success';
    let description = successState;
    if (error) {
      state = 'failure';
      description = failureState;
    }

    if (error) {
      throw error;
    } else {
      console.log(`${state}: ${description}`);
    }

  } catch (error) {
    core.setOutput('error', error.message);
    core.setFailed(error.message);
  }
};

run().catch(console.error);
