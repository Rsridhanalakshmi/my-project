import React, { useState } from "react";
import { FaCheck } from "react-icons/fa";

export default function Stepper({ steps = [], onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleNext = async () => {
    setErrorMsg("");
    const step = steps[currentStep];
    
    if (step.validate) {
      setIsProcessing(true);
      try {
        const isValid = await step.validate();
        if (!isValid) {
          setErrorMsg("Please complete the required fields for this step to proceed.");
          setIsProcessing(false);
          return;
        }
      } catch (err) {
        setErrorMsg(err.message || "Validation failed.");
        setIsProcessing(false);
        return;
      }
      setIsProcessing(false);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const handleBack = () => {
    setErrorMsg("");
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!steps || steps.length === 0) return null;

  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 transition-colors duration-300">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between w-full mb-12 relative px-4 sm:px-8 mt-2">
        {/* Background Track */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full"></div>
        {/* Active Fill Track */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-blue-500 transition-all duration-500 ease-in-out -translate-y-1/2 z-0 rounded-full"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500
                  ${isCompleted 
                    ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30" 
                    : isActive 
                      ? "bg-white dark:bg-slate-950 border-blue-500 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-110" 
                      : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400"}
                `}
              >
                {isCompleted ? <FaCheck size={14} /> : idx + 1}
              </div>
              <div className="absolute top-12 whitespace-nowrap text-center">
                <p className={`text-xs sm:text-sm font-bold ${isActive ? "text-blue-600 dark:text-blue-400" : isCompleted ? "text-slate-800 dark:text-slate-200" : "text-slate-400"}`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="mt-4 mb-6 min-h-[150px] animate-fadeIn">
        {steps[currentStep].content}
      </div>

      {/* Error Message Display */}
      {errorMsg && (
        <div className="mb-6 text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl flex items-center gap-3">
          <span className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center text-xs font-bold shrink-0">!</span>
          {errorMsg}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/60">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || isProcessing}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
            ${currentStep === 0 
              ? "opacity-0 cursor-default pointer-events-none" 
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"}
          `}
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={isProcessing}
          className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center min-w-[140px]"
        >
          {isProcessing ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : currentStep === steps.length - 1 ? (
            "Complete Workflow"
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
