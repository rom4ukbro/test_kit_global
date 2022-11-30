import { I18nValidationError } from 'nestjs-i18n';

export class hasErrorMessageOptions {
  errors: I18nValidationError[];
  propertiesMessages: Record<string, string[]>;
}

export function hasErrorMessages({
  errors,
  propertiesMessages,
}: hasErrorMessageOptions): boolean {
  const properties = Object.keys(propertiesMessages);
  const findMessages = Object.values(propertiesMessages);

  return properties.every((property, index) => {
    const error: I18nValidationError = errors.find(
      (v) => v.property === property,
    );
    if (!error) return false;

    const messages = Object.values(error.constraints);
    return findMessages[index].every((v) => messages.includes(v));
  });
}
