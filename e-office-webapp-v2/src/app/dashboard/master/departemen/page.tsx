'use client';

import { useEffect, useState } from 'react';
import { MasterCRUDTable, type Column } from '@/components/features/master/MasterCRUDTable';
import { departemenService, type Departemen } from '@/services';
import { handleApiError } from '@/lib/api';

export default function MasterDepartemenPage() {
	const [data, setData] = useState<Departemen[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await departemenService.getAll();
			setData(result);
		} catch (err) {
			setError(handleApiError(err).message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const columns: Column<Departemen>[] = [
		{ key: 'name', header: 'Nama' },
		{ key: 'code', header: 'Kode' },
	];

	const handleCreate = async (formData: Record<string, any>) => {
		await departemenService.create({
			name: formData.name,
			code: formData.code,
		});
		await fetchData();
	};

	const handleUpdate = async (id: string, formData: Record<string, any>) => {
		await departemenService.update(id, {
			name: formData.name,
			code: formData.code,
		});
		await fetchData();
	};

	const handleDelete = async (id: string) => {
		await departemenService.delete(id);
		await fetchData();
	};

	return (
		<MasterCRUDTable
			title="Departemen"
			description="Kelola data departemen."
			columns={columns}
			data={data}
			isLoading={isLoading}
			error={error}
			onCreate={handleCreate}
			onUpdate={handleUpdate}
			onDelete={handleDelete}
			getId={(item) => item.id}
			formFields={[
				{ key: 'name', label: 'Nama Departemen', required: true },
				{ key: 'code', label: 'Kode Departemen', required: true },
			]}
		/>
	);
}
