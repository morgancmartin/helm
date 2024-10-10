# Helm

Helm is an open-source LLM (Large Language Model) feature-based steering application inspired by [Goodfire](https://goodfire.ai/). The project leverages SAE (Spare Autoencoder) feature clamping to steer and modulate the outputs of LLM responses, offering a unique and powerful way to control and direct AI-generated content.

## Table of Contents

- [Introduction](#introduction)
- [Usage](#usage)
- [Implementation Details](#implementation-details)
- [Links](#links)
- [Future Improvements](#future-improvements)

## Introduction

Helm is designed to allow users to incorporate multiple feature applications simultaneously, delivering highly precise steering capabilities. This powerful tool can be used to refine the output of language models by clamping various features, ultimately orientating the AI's responses according to the user's needs.

## Usage

To get started with Helm, follow the steps below:

```sh
git clone git@github.com:morgancmartin/helm.git
cd helm/
source venv/bin/activate
pip install -r requirements.txt
cd helm/frontend/
npm run dev
```

## Implementation Details

Helm incorporates several advanced technologies and frameworks to achieve its functionalities:

- **Model**: Utilizes the GPT2-small model for generating responses.
- **Frontend**: Built using [Remix](https://remix.run/) for a seamless user interface experience.
- **Transformer Hooking**: Employs the HookedTransformer from the remarkable [TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) library.
- **Spare Autoencoders**: Utilizes Joseph Bloom's Open Source Spare Autoencoders across all Residual Stream Layers of GPT2-small. More details are available on [Neuronpedia](https://www.neuronpedia.org/gpt2sm-res-jb).

Helm’s capability of simultaneous feature application ensures precision steering, making it exceptionally useful for applications requiring meticulous control over language model outputs.

## Links

Here are some useful resources and technologies associated with Helm:

- [Goodfire](https://goodfire.ai/)
- [TransformerLens](https://github.com/TransformerLensOrg/TransformerLens)
- [Remix](https://remix.run/)
- [GPT2-Small SAEs on Hugging Face](https://huggingface.co/jbloom/GPT2-Small-SAEs)
- [Neuronpedia: GPT2-Small Residual Stream SAEs](https://www.neuronpedia.org/gpt2sm-res-jb)

## Future Improvements

In future updates, Helm aims to introduce the following enhancements:

- **Support for Multiple Models**: Extend support beyond GPT2-small to incorporate a variety of models, enhancing flexibility and application scope.
- **Max Activating Examples for Feature Cards**: Enable the system to present maximum activating examples for feature cards, thereby providing improved insights and control.

---

Helm continues to evolve and aims to become an integral tool in steering the output of Large Language Models with unparalleled precision and ease. Contributions and feedback are always welcome in this ongoing journey of innovation!
