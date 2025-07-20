'use client';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const REMOTE_MODELS = [
	{ label: 'Gemini 1.5 Pro', value: 'remote::gemini::gemini-1.5-pro' },
	{ label: 'DeepSeek-Chat', value: 'remote::deepseek::deepseek-chat' },
	{ label: 'Groq Llama3-70B', value: 'remote::groq::llama3-70b-8192' },
	{ label: 'OpenRouter Custom', value: 'remote::openrouter::' },
];

export default function ModelSelector({ onChange }: { onChange: (m: string) => void }) {
	const [models, setModels] = useState<string[]>([]);
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<string>('qwen3:1.7b');
	const [provider, setProvider] = useState<'local' | 'openai' | 'gemini'>('local');

	useEffect(() => {
		fetch('/api/models/local')
			.then((r) => r.json())
			.then(setModels);
	}, []);

	const handle = (v: string) => {
		setSelected(v);
		if (v.startsWith('remote::')) {
			setOpen(true);
		} else {
			onChange(v);
		}
	};

	return (
		<>
			<Select value={selected} onValueChange={handle}>
				<SelectTrigger className="w-48">
					<SelectValue placeholder="llama3.1:latest" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="local" disabled>
						Local Models
					</SelectItem>
					{models.map((m) => (
						<SelectItem key={m} value={m}>
							{m}
						</SelectItem>
					))}
					<SelectItem value="remote-label" disabled>
						Remote (needs key)
					</SelectItem>
					{REMOTE_MODELS.map((m) => (
						<SelectItem
							key={m.value}
							value={m.value}
							disabled={m.value === 'remote::openrouter::' ? false : undefined}
						>
							{m.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Provide API key</DialogTitle>
					</DialogHeader>
					{selected === 'remote::openrouter::' && (
						<>
							<Input placeholder="Model ID e.g. mistralai/Mixtral-8x7B" className="mb-2" />
							<Input placeholder="OpenRouter key sk-..." className="mb-2" />
						</>
					)}
					<Input placeholder="sk-..." />
					<Button onClick={() => setOpen(false)}>Save & Use</Button>
				</DialogContent>
			</Dialog>
		</>
	);
}