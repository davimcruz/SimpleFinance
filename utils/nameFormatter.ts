export const formatName = (value: string): string => {
  // Remove caracteres que não são letras, números ou espaços
  return value.replace(/[^a-zA-Z0-9\s]/g, '');
};

export const validateName = (value: string): boolean => {
  // Verifica se o nome contém apenas letras, números e espaços, e não está vazio
  return /^[a-zA-Z0-9\s]+$/.test(value) && value.trim().length > 0;
};

export const nameErrorMessage = "O nome deve conter apenas letras, números e espaços, e não pode estar vazio.";

export const useNameInput = () => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const formattedValue = formatName(e.target.value);
    field.onChange(formattedValue);
  };

  return {
    handleNameChange,
    validateName,
    nameErrorMessage,
  };
};
