export function stepper(params: StepperParams) {
  const { start = 0, increment = 1, total = Infinity, onStep } = params || {};
  let step = start;

  return {
    total,
    step: () => {
      step = step + increment;
      if (onStep) {
        onStep(step, total);
      }
      return step;
    },
  };
}

type StepperParams = {
  start?: number;
  total?: number;
  increment?: number;
  onStep?: (step: number, total: number) => void;
};