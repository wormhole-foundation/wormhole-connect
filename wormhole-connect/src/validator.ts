// import validator from 'react-validation';
const required = (value: string) => {
  if (!value.toString().trim().length) {
    // We can return string or jsx as the 'error' prop for the validated Component
    return 'require';
  }
};
// validator

// con
