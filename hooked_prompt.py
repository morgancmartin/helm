import argparse
import torch as t
from sae_lens import SAE
from transformer_lens import HookedTransformer
from typing import List

def get_sae_for_layer(model, device, layer: int):
    sae, cfg_dict, _ = SAE.from_pretrained(
        release="gpt2-small-res-jb",
        sae_id=f"blocks.{layer}.hook_resid_pre",
        device=device
    )

    hook_point = sae.cfg.hook_name

    sv_prompt = "I am Joe Biden, president of the United States of America!!!"
    sv_logits, cache = model.run_with_cache(sv_prompt, prepend_bos=True)
    sv_feature_acts = sae.encode(cache[hook_point])
    sae_out = sae.decode(sv_feature_acts)

    return sae, sae_out



def generate(prompt, features=[]):
    # device setup
    if t.backends.mps.is_available():
        device = "mps"
    else:
        device = "cuda" if t.cuda.is_available() else "cpu"


    model = HookedTransformer.from_pretrained("gpt2-small", device=device)
    saes = {}
    if len(features) > 0:
        for layer, feature, coef in features:
            sae, sae_out = get_sae_for_layer(model, device, layer)
            saes[layer] = [sae, sae_out]

    sampling_kwargs = dict(temperature=1.0, top_p=0.1, freq_penalty=1.0)


    def create_steering_hook(features):
        def steering_hook(resid_pre, hook):
            if resid_pre.shape[1] == 1:
                return
            for layer, feature_index, coefficient in features:
                sae, sae_out = saes[layer]
                position = sae_out.shape[1]
                steering_vector = coefficient * sae.W_dec[feature_index]
                resid_pre[:, :position - 1, :] += steering_vector

        return steering_hook


    def hooked_generate(prompt_batch, max_new_tokens=50, seed=None, **kwargs):
        if seed is not None:
            t.manual_seed(seed)

        tokenized = model.to_tokens(prompt_batch)
        generated = tokenized.clone()

        current_token = 0
        token_count = 100
        end_token = min(current_token + token_count, max_new_tokens)
        hook = create_steering_hook(features)
        with model.hooks(fwd_hooks=[(f"blocks.6.hook_resid_post", hook)]):
            result = model.generate(
                stop_at_eos=False,  # avoids a bug on MPS
                input=generated,
                max_new_tokens=end_token - current_token,
                do_sample=True,
                **kwargs
            )

        generated = result
        current_token = end_token

        return generated

    def base_generate(prompt_batch, max_new_tokens=50, seed=None, **kwargs):
        if seed is not None:
            t.manual_seed(seed)

        tokenized = model.to_tokens(prompt_batch)
        generated = tokenized.clone()

        current_token = 0
        token_count = 100
        end_token = min(current_token + token_count, max_new_tokens)

        result = model.generate(
            stop_at_eos=False,  # avoids a bug on MPS
            input=generated,
            max_new_tokens=end_token - current_token,
            do_sample=True,
            **kwargs
        )

        generated = result
        current_token = end_token

        return generated


    def run_generate(the_prompt):
        model.reset_hooks()
        is_hooked = len(features) > 0
        res = hooked_generate([the_prompt], max_new_tokens=450, seed=None, **sampling_kwargs) if is_hooked else base_generate([the_prompt], max_new_tokens=450, seed=None, **sampling_kwargs)

        res_str = model.to_string(res[:, 1:])
        result = ("\n\n" + "-" * 80 + "\n\n").join(res_str)

        return result


    result = run_generate(prompt)

    print(result)

def parse_vector_of_vectors(vector_string):
    """
    Parses a string representation of a vector of vectors into a list of lists.
    Example input: "1,2,3;4,5,6"
    Example output: [[1, 2, 3], [4, 5, 6]]
    """
    try:
        # Split the string by semicolons to separate the inner lists
        sublists = vector_string.split(';')
        # Parse each sublist into a list of integers
        return [list(map(int, sublist.split(','))) for sublist in sublists]
    except ValueError as e:
        raise argparse.ArgumentTypeError(f"Invalid vector input format: {vector_string}. Error: {e}")


def main():
    parser = argparse.ArgumentParser(description="Process a prompt and a feature index.")
    parser.add_argument('prompt', type=str, help="The prompt string to be processed.")
    parser.add_argument('--features', type=parse_vector_of_vectors, default=None, help="Optional feature vectors")

    args = parser.parse_args()

    generate(args.prompt, args.features) if args.features else generate(args.prompt)

if __name__ == '__main__':
    main()
