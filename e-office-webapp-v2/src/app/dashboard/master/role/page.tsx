'use client';

import { useEffect, useState } from 'react';
import { MasterCRUDTable, type Column } from '@/components/features/master/MasterCRUDTable';
import { roleService, type Role } from '@/services';
import { handleApiError } from '@/lib/api';

export default function MasterRolePage() {
	const [data, setData] = useState<Role[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await roleService.getAll();
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

	const columns: Column<Role>[] = [
		{ key: 'name', header: 'Nama Role' },
	];

	const handleCreate = async (formData: Record<string, any>) => {
		await roleService.create({
			name: formData.name,
		});
		await fetchData();
	};

	const handleUpdate = async (id: string, formData: Record<string, any>) => {
		await roleService.update(id, {
			name: formData.name,
		});
		await fetchData();
	};

	const handleDelete = async (id: string) => {
		await roleService.delete(id);
		await fetchData();
	};

	return (
		<MasterCRUDTable
			title="Role"
			description="Kelola role dan permission."
			columns={columns}
			data={data}
			isLoading={isLoading}
			error={error}
			onCreate={handleCreate}
			onUpdate={handleUpdate}
			onDelete={handleDelete}
			getId={(item) => item.id}
			formFields={[
				{ key: 'name', label: 'Nama Role', required: true },
			]}
		/>
	);
}
