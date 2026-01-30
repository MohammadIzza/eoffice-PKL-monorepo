'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Loader2, AlertCircle, Trash2 } from 'lucide-react';

export interface Column<T> {
	key: keyof T | string;
	header: string;
	render?: (item: T) => React.ReactNode;
}

export interface MasterCRUDTableProps<T> {
	title: string;
	description: string;
	columns: Column<T>[];
	data: T[];
	isLoading: boolean;
	error: string | null;
	onCreate: (data: Record<string, any>) => Promise<void>;
	onUpdate: (id: string, data: Record<string, any>) => Promise<void>;
	onDelete?: (id: string) => Promise<void>;
	getId: (item: T) => string;
	formFields: Array<{
		key: string;
		label: string;
		type?: 'text' | 'email' | 'number' | 'select';
		options?: Array<{ value: string; label: string }>;
		required?: boolean;
	}>;
}

export function MasterCRUDTable<T extends Record<string, any>>({
	title,
	description,
	columns,
	data,
	isLoading,
	error,
	onCreate,
	onUpdate,
	onDelete,
	getId,
	formFields,
	editFormFields,
}: MasterCRUDTableProps<T>) {
	const effectiveEditFields = editFormFields || formFields;
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deletingItem, setDeletingItem] = useState<T | null>(null);
	const [editingItem, setEditingItem] = useState<T | null>(null);
	const [formData, setFormData] = useState<Record<string, any>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleCreate = () => {
		setFormData({});
		setSubmitError(null);
		setIsCreateOpen(true);
	};

	const handleEdit = (item: T) => {
		setEditingItem(item);
		const initialData: Record<string, any> = {};
		formFields.forEach((field) => {
			initialData[field.key] = item[field.key] ?? '';
		});
		setFormData(initialData);
		setSubmitError(null);
		setIsEditOpen(true);
	};

	const handleDeleteClick = (item: T) => {
		setDeletingItem(item);
		setSubmitError(null);
		setIsDeleteOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deletingItem || !onDelete) return;
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			await onDelete(getId(deletingItem));
			setIsDeleteOpen(false);
			setDeletingItem(null);
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : 'Gagal menghapus data');
		} finally {
			setIsSubmitting(false);
		}
	};

	const getInputValue = (field: typeof formFields[0], value: any) => {
		if (field.type === 'date' && value) {
			if (typeof value === 'string') return value.split('T')[0];
			if (value instanceof Date) return value.toISOString().split('T')[0];
		}
		return value || '';
	};

	const handleSubmitCreate = async () => {
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			await onCreate(formData);
			setIsCreateOpen(false);
			setFormData({});
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : 'Gagal membuat data');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmitUpdate = async () => {
		if (!editingItem) return;
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			await onUpdate(getId(editingItem), formData);
			setIsEditOpen(false);
			setEditingItem(null);
			setFormData({});
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : 'Gagal memperbarui data');
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderField = (field: typeof formFields[0], value: any) => {
		if (field.type === 'select' && field.options) {
			return (
				<select
					id={field.key}
					value={value || ''}
					onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
					className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="">Pilih {field.label}</option>
					{field.options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			);
		}

		return (
			<Input
				id={field.key}
				type={field.type || 'text'}
				value={value || ''}
				onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
				required={field.required}
			/>
		);
	};

	return (
		<div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
			<div className="max-w-7xl mx-auto">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">{title}</h1>
						<p className="text-[#86868B] mt-1">{description}</p>
					</div>
					<Button onClick={handleCreate} className="bg-[#0071E3] text-white hover:bg-[#0051A3]">
						<Plus className="w-4 h-4 mr-2" />
						Tambah Baru
					</Button>
				</div>

				{error && (
					<Alert variant="destructive" className="mb-6">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className="bg-white border border-[#E5E5E7] rounded-xl overflow-hidden">
					{isLoading ? (
						<div className="p-6 space-y-4">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									{columns.map((col) => (
										<TableHead key={String(col.key)} className="font-semibold text-[#1D1D1F]">
											{col.header}
										</TableHead>
									))}
									<TableHead className="w-[100px] text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.length === 0 ? (
									<TableRow>
										<TableCell colSpan={columns.length + 1} className="text-center text-[#86868B] py-8">
											Tidak ada data
										</TableCell>
									</TableRow>
								) : (
									data.map((item) => (
										<TableRow key={getId(item)}>
											{columns.map((col) => (
												<TableCell key={String(col.key)}>
													{col.render ? col.render(item) : String(item[col.key] ?? '-')}
												</TableCell>
											))}
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleEdit(item)}
													className="text-[#0071E3] hover:text-[#0051A3]"
												>
													<Edit className="w-4 h-4" />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</div>

				{/* Create Dialog */}
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Tambah {title}</DialogTitle>
							<DialogDescription>{description}</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							{formFields.map((field) => (
								<div key={field.key} className="space-y-2">
									<Label htmlFor={field.key}>
										{field.label}
										{field.required && <span className="text-red-500 ml-1">*</span>}
									</Label>
									{renderField(field, formData[field.key])}
								</div>
							))}
							{submitError && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{submitError}</AlertDescription>
								</Alert>
							)}
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
								Batal
							</Button>
							<Button onClick={handleSubmitCreate} disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Menyimpan...
									</>
								) : (
									'Simpan'
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Edit Dialog */}
				<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Edit {title}</DialogTitle>
							<DialogDescription>{description}</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							{effectiveEditFields.map((field) => (
								<div key={field.key} className="space-y-2">
									<Label htmlFor={`edit-${field.key}`}>
										{field.label}
										{field.required && <span className="text-red-500 ml-1">*</span>}
									</Label>
									{renderField(field, formData[field.key])}
								</div>
							))}
							{submitError && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{submitError}</AlertDescription>
								</Alert>
							)}
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
								Batal
							</Button>
							<Button onClick={handleSubmitUpdate} disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Menyimpan...
									</>
								) : (
									'Simpan'
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
