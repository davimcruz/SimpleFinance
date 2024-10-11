export const formatName = (value: string): string => {
  return value.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, '');
};

export const validateName = (value: string): boolean => {
  return /^[a-zA-ZÀ-ÿ0-9\s]+$/.test(value) && value.trim().length > 0;
};

export const nameErrorMessage = "O nome deve conter apenas letras (incluindo acentuadas), números e espaços, e não pode estar vazio.";

export const useNameInput = () => {
  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: { onChange: (value: string) => void }
  ) => {
    const formattedValue = formatName(e.target.value);
    field.onChange(formattedValue);
  };

  return {
    handleNameChange,
    validateName,
    nameErrorMessage,
  };
};
