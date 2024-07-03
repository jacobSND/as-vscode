export async function poll<Result>(callback: Callback<Result>, options?: PollOptions): Promise<Result | undefined> {
  const { timeout = 10000, interval = 10000, cancellationToken } = options || {};
  const endTime = Date.now() + timeout;
  let result: Result | undefined = undefined;
  while (Date.now() < endTime && !result && !cancellationToken?.isCancellationRequested) {
    result = await callback();
    if (!result) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  return result;
}

type Callback<Result> = () => Promise<Result | undefined>;
type PollOptions = {
  timeout?: number;
  cancellationToken?: { isCancellationRequested: boolean }
  interval?: number;
};