import React from "react";

type indexProps = {
  word: string;
};

const index: React.FC<indexProps> = ({ word }) => <h1>Hello, {word}</h1>;

export default index;
