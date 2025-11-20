import { addAssingnedContractor, addcontractor, deleteContractor, getConstractor, getConstractorv1 } from "@/lib/constractor";
import { getContact, getSingleContact } from "@/lib/contact";
import { getExtermination } from "@/lib/extermination";
import { getNewsletter } from "@/lib/newsletter";
import { addcPrice, getPayment, getPrice } from "@/lib/payment";
import { changePassword, getProfile, updateProfileInfo } from "@/lib/profileInfo";
import { getService } from "@/lib/service";
import { ProfileUpdatePayload, UserProfileResponse } from "@/types/userDataType";
import {  useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useProfileQuery(token: string | undefined) {
    return useQuery<UserProfileResponse>({
        queryKey: ["me"],
        queryFn: () => {
            if (!token) throw new Error("Token is missing")
            return getProfile(token)
        },
        enabled: !!token,
    })
}

export function useProfileInfoUpdate(token: string, onSuccessCallback?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ProfileUpdatePayload) => updateProfileInfo(token, payload),
        onSuccess: () => {
            toast.success("Profile updated successfully");
            queryClient.invalidateQueries({ queryKey: ["me"] });
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (error: unknown) => {
            if (error instanceof Error) toast.error(error.message || "Update failed");
            else toast.error("Update failed");
        },
    });
}

export function useChnagePassword(
    token: string, onSuccessCallback?: () => void) {
    return useMutation({
        mutationFn: (payload: { oldPassword: string; newPassword: string }) =>
            changePassword(token, payload),
        onSuccess: (data) => {
            toast.success(data?.message || "Password updated successfully");
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (error: unknown) => {
            if (error instanceof Error) toast.error(error.message || "Update failed");
            else toast.error("Update failed");
        },
    });
}

export function useGetContact(
    token: string | undefined,
    currentPage: number,
    itemsPerPage: number
) {
    return useQuery({
        queryKey: ["contact", currentPage, itemsPerPage],
        queryFn: () => {
            if (!token) throw new Error("Token is missing");
            return getContact(token, currentPage, itemsPerPage);
        },
        enabled: !!token,
    });
}

export function useGetSingelContact(
    token: string | undefined,
    id: string
) {
    return useQuery({
        queryKey: ["singelContact", id],
        queryFn: () => {
            if (!token) throw new Error("Token is missing");
            return getSingleContact(token, id);
        },
        enabled: !!token,
    });
}


export function useGetPayment(
    token: string | undefined,
    currentPage: number,
    itemsPerPage: number
) {
    return useQuery({
        queryKey: ["payment", currentPage, itemsPerPage],
        queryFn: () => {
            if (!token) throw new Error("Token is missing");
            return getPayment(token, currentPage, itemsPerPage);
        },
        enabled: !!token,
    });
}

export function useGetExtermination(
    token: string | undefined,
    currentPage: number,
    itemsPerPage: number
) {
    return useQuery({
        queryKey: ["extermination", currentPage, itemsPerPage],
        queryFn: () => {
            if (!token) throw new Error("Token is missing");
            return getExtermination(token, currentPage, itemsPerPage);
        },
        enabled: !!token,
    });
}

export function useGetConstractor(
    token: string | undefined,
) {
    return useQuery({
        queryKey: ["constractor"],
        queryFn: () => {
            if (!token) throw new Error("Token is missing");
            return getConstractor(token);
        },
        enabled: !!token,
    });
}

export function useAssignedConstractor(token: string, onSuccessCallback?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: { exterminationId: string; constractorId: string }) => addAssingnedContractor(token, payload),
        onSuccess: () => {
            toast.success("Assign Contractor successfully");
            queryClient.invalidateQueries({ queryKey: ["constractor"] });
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (error: unknown) => {
            if (error instanceof Error) toast.error(error.message || "Update failed");
            else toast.error("Update failed");
        },
    });
}

export function useGetConstractorv1(
    token: string | undefined,
    currentPage: number,
    itemsPerPage: number
) {
    return useQuery({
        queryKey: ["constractor"],
        queryFn: () => {
            if (!token) throw new Error("Token is missing");
            return getConstractorv1(token, currentPage, itemsPerPage);
        },
        enabled: !!token,
    });
}

export function useDeleteConstractor (token: string, onSuccessCallback?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteContractor(token, id),
        onSuccess: () => {
            toast.success("constractor deleted successfully");
            if (onSuccessCallback) onSuccessCallback();
            queryClient.invalidateQueries({ queryKey: ["constractor"] });
        },
        onError: (error: unknown) => {
            if (error instanceof Error) toast.error(error.message || "Update failed");
            else toast.error("Update failed");
        },
    });
}

export interface ContractorPayload {
  companyName: string
  companyAddress: string
  name: string
  number: string
  email: string
  serviceId: string
  workHours: string
  superContact: string
  serviceAreas: string
  scopeofWork: string
  superName: string
  image: File | null
}


export function useCreateContractor(token: string, onSuccessCallback?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload:ContractorPayload) => addcontractor(token, payload),
        onSuccess: () => {
            toast.success("Profile updated successfully");
            queryClient.invalidateQueries({ queryKey: ["constractor"] });
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (error: unknown) => {
            if (error instanceof Error) toast.error(error.message || "Update failed");
            else toast.error("Update failed");
        },
    });
}


export function useGetService(
    token: string | undefined,
) {
    return useQuery({
        queryKey: ["service"],
        queryFn: () => {
            if (!token) throw new Error("Token is missing");
            return getService(token);
        },
        enabled: !!token,
    });
}

export function useGetNewsletter(
    token: string | undefined,
    currentPage: number,
    itemsPerPage: number
) {
    return useQuery({
        queryKey: ["newsletter", currentPage, itemsPerPage],
        queryFn: () => {
            if (!token) throw new Error("Token is missing");
            return getNewsletter(token , currentPage, itemsPerPage);
        },
        enabled: !!token,
    });
}

export function useGetPrice(
    token: string | undefined,
) {
    return useQuery({
        queryKey: ["price"],
        queryFn: () => {
            if (!token) throw new Error("Token is missing");
            return getPrice(token);
        },
        enabled: !!token,
    });
}

export function useAddPrice(token: string, setIsPriceModalOpen: React.Dispatch<React.SetStateAction<boolean>> , onSuccessCallback?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload:{price:number}) => addcPrice(token, payload),
        onSuccess: () => {
            toast.success("Price added successfully");
            queryClient.invalidateQueries({ queryKey: ["price"] });
            setIsPriceModalOpen(false)
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (error: unknown) => {
            if (error instanceof Error) toast.error(error.message || "Update failed");
            else toast.error("Update failed");
        },
    });
}