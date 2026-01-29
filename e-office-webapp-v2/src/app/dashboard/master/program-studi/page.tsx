'use client';

import { useEffect, useState } from 'react';
import { MasterCRUDTable, type Column } from '@/components/features/master/MasterCRUDTable';
import { programStudiService, type ProgramStudi } from '@/services';
import { departemenService } from '@/services';
import { handleApiError } from '@/lib/api';

export default function MasterProgramStudiPage() {
	const [data, setData] = useState<ProgramStudi[]>([]);
	const [departemenList, setDepartemenList] = useState<Array<{ value: string; label: string }>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [prodiResult, deptResult] = await Promise.all([
				programStudiService.getAll(),
				departemenService.getAll(),
			]);
			setData(prodiResult);
			setDepartemenList(deptResult.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })));
		} catch (err) {
			setError(handleApiError(err).message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const columns: Column<ProgramStudi>[] = [
		{ key: 'name', header: 'Nama' },
		{ key: 'code', header: 'Kode' },
		{
			key: 'departemen',
			header: 'Departemen',
			render: (item) => item.departemen?.name || '-',
		},
	];

	const handleCreate = async (formData: Record<string, any>) => {
		await programStudiService.create({
			name: formData.name,
			code: formData.code,
			departemenId: formData.departemenId,
		});
		await fetchData();
	};

	const handleUpdate = async (id: string, formData: Record<string, any>) => {
		await programStudiService.update(id, {
			name: formData.name,
			code: formData.code,
			departemenId: formData.departemenId,
		});
		await fetchData();
	};

	return (
		<MasterCRUDTable
			title="Program Studi"
			description="Kelola data program studi."
			columns={columns}
			data={data}
			isLoading={isLoading}
			error={error}
			onCreate={handleCreate}
			onUpdate={handleUpdate}
			getId={(item) => item.id}
			formFields={[
				{ key: 'name', label: 'Nama Program Studi', required: true },
				{ key: 'code', label: 'Kode Program Studi', required: true },
				{
					key: 'departemenId',
					label: 'Departemen',
					type: 'select',
					options: departemenList,
					required: true,
				},
			]}
		/>
	);
}
