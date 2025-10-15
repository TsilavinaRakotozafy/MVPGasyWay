"use client";

import * as React from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "./utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children?: React.ReactNode;
}

interface InputFieldProps extends FormFieldProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

interface TextareaFieldProps extends FormFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  id?: string;
}

interface SelectFieldProps extends FormFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  id?: string;
}

// Composant de base pour wrapper label + champ
function FormFieldWrapper({ label, required, error, className, children }: FormFieldProps) {
  return (
    <div className={cn(className)}>
      <Label required={required}>{label}</Label>
      <div className="mt-1">
        {children}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

// Champ Input
function InputField({ 
  label, 
  required, 
  error, 
  className, 
  type = "text", 
  placeholder, 
  value, 
  onChange,
  id
}: InputFieldProps) {
  return (
    <FormFieldWrapper label={label} required={required} error={error} className={className}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </FormFieldWrapper>
  );
}

// Champ Textarea
function TextareaField({ 
  label, 
  required, 
  error, 
  className, 
  placeholder, 
  value, 
  onChange,
  rows = 3,
  id
}: TextareaFieldProps) {
  return (
    <FormFieldWrapper label={label} required={required} error={error} className={className}>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </FormFieldWrapper>
  );
}

// Champ Select
function SelectField({ 
  label, 
  required, 
  error, 
  className, 
  placeholder, 
  value, 
  onChange,
  options,
  id
}: SelectFieldProps) {
  return (
    <FormFieldWrapper label={label} required={required} error={error} className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
}

// Composant générique pour les cas personnalisés
function FormField({ label, required, error, className, children }: FormFieldProps) {
  return <FormFieldWrapper label={label} required={required} error={error} className={className}>{children}</FormFieldWrapper>;
}

export { 
  FormField, 
  InputField, 
  TextareaField, 
  SelectField 
};