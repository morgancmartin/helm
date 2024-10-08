import argparse
import torch as t
from sae_lens import SAE
from transformer_lens import HookedTransformer
# from transformers import AutoTokenizer, AutoModelForCausalLM

def generate(prompt="There once was a little boy named Johnny.", feature=0, layer=6):
    # device setup
    if t.backends.mps.is_available():
        device = "mps"
    else:
        device = "cuda" if t.cuda.is_available() else "cpu"


    # hf_model = AutoModelForCausalLM.from_pretrained("google/gemma-2b", device_map="auto")
    # Get model and SAE
    model = HookedTransformer.from_pretrained("gpt2-small", device=device)
    # print("LOADED model")
    sae, cfg_dict, _ = SAE.from_pretrained(
        release="gpt2-small-res-jb",
        sae_id=f"blocks.{layer}.hook_resid_pre",
        device=device
    )

    hook_point = sae.cfg.hook_name
    # print(f"hook_point: {hook_point}")

    sv_prompt = "I am Joe Biden, president of the United States of America!!!"
    sv_logits, cache = model.run_with_cache(sv_prompt, prepend_bos=True)
    tokens = model.to_tokens(sv_prompt)
    # print(f"tokens: {tokens}")

    sv_feature_acts = sae.encode(cache[hook_point])

    sae_out = sae.decode(sv_feature_acts)

    # print(t.topk(sv_feature_acts, 3))

    # Read the coefficients from the command line (parse --coef1, --coef2, --coef3)
    # import argparse

    # parser = argparse.ArgumentParser()
    # parser.add_argument("--coef1", type=float, default=100.0)
    # parser.add_argument("--coef2", type=float, default=300.0)
    # parser.add_argument("--coef3", type=float, default=150.0)
    # args = parser.parse_args()

    # Define the dynamic steering vectors with their respective coefficients
    steering_vectors = [
        (200, feature, 200.0),
        # Add more tuples as needed: (token_count, vector_index, coefficient)
    ]

    # example_prompt = "There once was a little boy named Johnny."
    sampling_kwargs = dict(temperature=1.0, top_p=0.1, freq_penalty=1.0)


    def create_steering_hook(vector_index, coefficient):
        def steering_hook(resid_pre, hook):
            if resid_pre.shape[1] == 1:
                return
            position = sae_out.shape[1]
            steering_vector = coefficient * sae.W_dec[vector_index]
            resid_pre[:, :position - 1, :] += steering_vector

        return steering_hook


    def hooked_generate(prompt_batch, max_new_tokens=50, seed=None, **kwargs):
        if seed is not None:
            t.manual_seed(seed)

        tokenized = model.to_tokens(prompt_batch)
        generated = tokenized.clone()

        current_token = 0
        for token_count, vector_index, coefficient in steering_vectors:
            end_token = min(current_token + token_count, max_new_tokens)
            hook = create_steering_hook(vector_index, coefficient)

            with model.hooks(fwd_hooks=[(f"blocks.{layer}.hook_resid_post", hook)]):
                result = model.generate(
                    stop_at_eos=False,  # avoids a bug on MPS
                    input=generated,
                    max_new_tokens=end_token - current_token,
                    do_sample=True,
                    **kwargs
                )

            generated = result
            current_token = end_token

            if current_token >= max_new_tokens:
                break

        return generated

    def base_generate(prompt_batch, max_new_tokens=50, seed=None, **kwargs):
        if seed is not None:
            t.manual_seed(seed)

        tokenized = model.to_tokens(prompt_batch)
        generated = tokenized.clone()

        current_token = 0
        # for token_count, vector_index, coefficient in steering_vectors:
        token_count = steering_vectors[0][0]
        end_token = min(current_token + token_count, max_new_tokens)
        # hook = create_steering_hook(vector_index, coefficient)

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
        is_hooked = steering_vectors[0][1] != 0
        res = hooked_generate([the_prompt], max_new_tokens=450, seed=None, **sampling_kwargs) if is_hooked else base_generate([the_prompt], max_new_tokens=450, seed=None, **sampling_kwargs)

        # Print results, removing the ugly beginning of sequence token
        res_str = model.to_string(res[:, 1:])
        result = ("\n\n" + "-" * 80 + "\n\n").join(res_str)

        return result


    # print("\nGeneration with dynamic steering and coefficients\n=====================================")
    result = run_generate(prompt)

    # print(f"coefs: {args.coef1}\n")
    print(result)
    # Save the result to a file
    # with open("generated_text.txt", "a") as f:
        # write the coefficients
        # f.write(f"coefs: {args.coef1}, {args.coef2}, {args.coef3}\n")
        # f.write(f"{result}\n\n")
    # print("\n=====================================")




def main():
    parser = argparse.ArgumentParser(description="Process a prompt and a feature index.")
    parser.add_argument('prompt', type=str, help="The prompt string to be processed.")
    parser.add_argument('--feature', type=int, default=None, help="Optional feature index.")
    parser.add_argument('--layer', type=int, default=None, help="Optional layer index.")

    args = parser.parse_args()

    # print(f"Prompt: {args.prompt}")
    # if args.feature is not None:
        # print(f"Feature Index: {args.feature}")

    generate(args.prompt, args.feature)

if __name__ == '__main__':
    main()
