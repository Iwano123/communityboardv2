import { Form } from 'react-bootstrap';

interface SelectProps {
  value: string;
  changeHandler: (value: string) => void;
  options: string[];
}

export default function Select({ value, changeHandler, options }: SelectProps) {
  return (
    <Form.Select
      value={value}
      onChange={(e) => changeHandler(e.target.value)}
      className="form-control-twitter"
    >
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </Form.Select>
  );
}