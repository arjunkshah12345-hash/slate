import "react";

declare module "react" {
  interface FormHTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
    toolautosubmit?: boolean | string;
  }
  interface TextareaHTMLAttributes<T> {
    toolparamtitle?: string;
    toolparamdescription?: string;
  }
  interface InputHTMLAttributes<T> {
    toolparamdescription?: string;
  }
}
