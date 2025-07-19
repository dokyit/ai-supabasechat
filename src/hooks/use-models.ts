import { useEffect, useState } from 'react';
export default () => {
  const [models, setModels] = useState<string[]>([]);
  const refresh = () =>
    fetch('/api/models/local')
      .then(r => r.json())
      .then(setModels);
  useEffect(() => { refresh(); }, []);
  return { models, refresh };
};