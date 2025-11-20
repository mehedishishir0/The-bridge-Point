
// app/(your-path)/EditApartment.tsx  (or wherever you keep it)
"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Play, X } from "lucide-react";
import { Header } from "@/components/Shared/Header";
import Bradecumb from "@/components/Shared/Bradecumb";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

/**
 * Types
 */
type ApartmentForm = {
  title: string;
  description: string;
  aboutListing: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  amenities: string[];
  day: string;
  month: string;
  availableTime: string; 
};

type MediaFile = {
  file?: File;
  url: string;
  remote?: boolean; 
};

type ApartmentResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    _id: string;
    title: string;
    description: string;
    aboutListing: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    amenities: string[];
    images: string[];
    videos: string[];
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    availableFrom: {
      month: string;
      time: string; 
    };
    day: string;
    createdAt?: string;
    updatedAt?: string;
  };
};


type ExtendedSession = Session & {
  accessToken?: string;
  token?: string;
  user?: Session["user"] & { accessToken?: string; token?: string };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Helpers
 */
const toDatetimeLocal = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const fetchApartment = async (id: string): Promise<ApartmentResponse> => {
  if (!API_BASE) throw new Error("API base URL is not defined.");
  const res = await fetch(`${API_BASE}/apartment/${id}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Failed to fetch apartment data");
  }
  return res.json();
};

const updateApartmentApi = async (id: string, payload: ApartmentForm, images: MediaFile[], videos: MediaFile[], token?: string) => {
  if (!API_BASE) throw new Error("API base URL is not defined.");
  const fd = new FormData();

  fd.append("title", payload.title);
  fd.append("description", payload.description);
  fd.append("aboutListing", payload.aboutListing);
  fd.append("price", payload.price);
  fd.append("bedrooms", payload.bedrooms);
  fd.append("bathrooms", payload.bathrooms);
  fd.append("squareFeet", payload.squareFeet);
  fd.append("address[street]", payload.street);
  fd.append("address[city]", payload.city);
  fd.append("address[state]", payload.state);
  fd.append("address[zipCode]", payload.zipCode);

  payload.amenities.forEach((a, i) => fd.append(`amenities[${i}]`, a));
  fd.append("day", payload.day);
  fd.append("availableFrom[month]", payload.month);

  try {
    const iso = new Date(payload.availableTime).toISOString();
    fd.append("availableFrom[time]", iso);
  } catch {
    fd.append("availableFrom[time]", payload.availableTime);
  }

  // Append only new files (media.file exists)
  images.forEach((m) => {
    if (m.file) fd.append("images", m.file);
  });
  videos.forEach((m) => {
    if (m.file) fd.append("videos", m.file);
  });

  const res = await fetch(`${API_BASE}/apartment/${id}`, {
    method: "PUT",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      // DO NOT set Content-Type for FormData (browser will set the boundary)
    },
    body: fd,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Failed to update apartment");
  }
  return res.json();
};

/**
 * Component
 */
const EditApartment: React.FC = () => {
  const router = useRouter();
  // next/navigation useParams typing is loose — cast safely
  const params = useParams() as { id?: string } | undefined;
  const id = params?.id;

  const sessionResult = useSession();
  const session = sessionResult.data as ExtendedSession | null;

  // token extraction: try a few common places, keep optional
  const token =
    session?.accessToken ?? session?.token ?? session?.user?.accessToken ?? session?.user?.token ?? "";

  const [form, setForm] = useState<ApartmentForm>({
    title: "",
    description: "",
    aboutListing: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    amenities: [],
    day: "",
    month: "",
    availableTime: "",
  });

  const [images, setImages] = useState<MediaFile[]>([]);
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [errors, setErrors] = useState<Partial<ApartmentForm>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { data, isLoading, error } = useQuery<ApartmentResponse, Error>({
    queryKey: ["apartment", id ?? "none"],
    queryFn: () => fetchApartment(id as string),
    enabled: Boolean(id),
  });

  // populate form when data loads
  useEffect(() => {
    if (!data?.data) return;
    const apt = data.data;
    setForm({
      title: apt.title ?? "",
      description: apt.description ?? "",
      aboutListing: apt.aboutListing ?? "",
      price: apt.price !== undefined ? String(apt.price) : "",
      bedrooms: apt.bedrooms !== undefined ? String(apt.bedrooms) : "",
      bathrooms: apt.bathrooms !== undefined ? String(apt.bathrooms) : "",
      squareFeet: apt.squareFeet !== undefined ? String(apt.squareFeet) : "",
      street: apt.address?.street ?? "",
      city: apt.address?.city ?? "",
      state: apt.address?.state ?? "",
      zipCode: apt.address?.zipCode ?? "",
      amenities: apt.amenities ?? [],
      day: apt.day ?? "",
      month: apt.availableFrom?.month ?? "",
      availableTime: toDatetimeLocal(apt.availableFrom?.time),
    });

    setImages((apt.images || []).map((u) => ({ url: u, remote: true })));
    setVideos((apt.videos || []).map((u) => ({ url: u, remote: true })));
  }, [data]);

  // input handlers
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value } as ApartmentForm));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleAmenitiesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      amenities: checked ? [...prev.amenities, value] : prev.amenities.filter((a) => a !== value),
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newImages: MediaFile[] = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newVideos: MediaFile[] = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setVideos((prev) => [...prev, ...newVideos].slice(0, 5));
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));
  const removeVideo = (index: number) => setVideos((prev) => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const newErrors: Partial<ApartmentForm> = {};
    if (!form.title) newErrors.title = "Title is required";
    if (!form.description) newErrors.description = "Description is required";
    if (!form.price || Number.isNaN(Number(form.price))) newErrors.price = "Valid price required";
    if (!form.bedrooms || Number.isNaN(Number(form.bedrooms))) newErrors.bedrooms = "Valid bedrooms";
    if (!form.bathrooms || Number.isNaN(Number(form.bathrooms))) newErrors.bathrooms = "Valid bathrooms";
    if (!form.squareFeet || Number.isNaN(Number(form.squareFeet))) newErrors.squareFeet = "Valid squareFeet";
    if (!form.street) newErrors.street = "Street required";
    if (!form.city) newErrors.city = "City required";
    if (!form.state) newErrors.state = "State required";
    if (!form.zipCode) newErrors.zipCode = "Zip required";
    if (!form.day) newErrors.day = "Day required";
    if (!form.month) newErrors.month = "Month required";
    if (!form.availableTime) newErrors.availableTime = "Available time required";

    setErrors(newErrors);

    if (images.length === 0) toast.error("At least one image is required");
    return Object.keys(newErrors).length === 0 && images.length > 0;
  };

  // mutation
  const mutation = useMutation({
    mutationFn: async (vars: { id: string; payload: ApartmentForm; images: MediaFile[]; videos: MediaFile[]; token?: string }) =>
      updateApartmentApi(vars.id, vars.payload, vars.images, vars.videos, vars.token),
    onSuccess: () => {
      toast.success("Apartment updated successfully!");
      router.push("/apartment-listings");
    },
    onError: (e) => {
      const msg = e?.message ?? "Failed to update apartment";
      toast.error(msg);
    },
  });

  const handlePublish = async () => {
    if (!id) {
      toast.error("Missing apartment id");
      return;
    }
    if (!token) {
      toast.error("Not authenticated. Please login.");
      return;
    }
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await mutation.mutateAsync({ id, payload: form, images, videos, token });
    } catch (e) {
      // onError handles notification
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return <div className="text-red-500 p-4">Error loading apartment: {error.message}</div>;
  }

  return (
    <div className="min-h-screen">
      <Header tittle="Edit Apartment Listing" />
      <Bradecumb pageName="Apartment Listings" subPageName="Edit Apartment Listing" />
      <div className="pr-5">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="space-y-6">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-base font-medium mb-2">Add Title</label>
                    <Input name="title" value={form.title} onChange={handleInputChange} placeholder="Add your title..." />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-medium mb-2">Street</label>
                      <Input name="street" value={form.street} onChange={handleInputChange} placeholder="House 15, Road 27" />
                      {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-medium mb-2">City</label>
                      <Input name="city" value={form.city} onChange={handleInputChange} placeholder="Dhaka" />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-medium mb-2">State</label>
                      <Input name="state" value={form.state} onChange={handleInputChange} placeholder="Dhaka Division" />
                      {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-medium mb-2">Zip Code</label>
                      <Input name="zipCode" value={form.zipCode} onChange={handleInputChange} placeholder="1209" />
                      {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-base font-medium mb-2">Price</label>
                      <Input type="number" name="price" value={form.price} onChange={handleInputChange} />
                      {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-medium mb-2">Bedrooms</label>
                      <Input type="number" name="bedrooms" value={form.bedrooms} onChange={handleInputChange} />
                      {errors.bedrooms && <p className="text-red-500 text-sm mt-1">{errors.bedrooms}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-medium mb-2">Bathrooms</label>
                      <Input type="number" name="bathrooms" value={form.bathrooms} onChange={handleInputChange} />
                      {errors.bathrooms && <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-medium mb-2">Square Feet</label>
                      <Input type="number" name="squareFeet" value={form.squareFeet} onChange={handleInputChange} />
                      {errors.squareFeet && <p className="text-red-500 text-sm mt-1">{errors.squareFeet}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium mb-2">Amenities</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Parking", "Lift", "Security", "Balcony", "Generator", "Air Conditioning"].map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-2">
                          <input type="checkbox" value={amenity} checked={form.amenities.includes(amenity)} onChange={handleAmenitiesChange} />
                          <span>{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-base font-medium mb-2">Day</label>
                      <select name="day" value={form.day} onChange={handleInputChange}>
                        <option value="">Select a day</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                      {errors.day && <p className="text-red-500 text-sm mt-1">{errors.day}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium mb-2">Select Month</label>
                      <select name="month" value={form.month} onChange={handleInputChange}>
                        <option value="">Select</option>
                        <option>January</option>
                        <option>February</option>
                        <option>March</option>
                        <option>April</option>
                        <option>May</option>
                        <option>June</option>
                        <option>July</option>
                        <option>August</option>
                        <option>September</option>
                        <option>October</option>
                        <option>November</option>
                        <option>December</option>
                      </select>
                      {errors.month && <p className="text-red-500 text-sm mt-1">{errors.month}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium mb-2">Available Time</label>
                      <Input type="datetime-local" name="availableTime" value={form.availableTime} onChange={handleInputChange} />
                      {errors.availableTime && <p className="text-red-500 text-sm mt-1">{errors.availableTime}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium mb-2">Description</label>
                    <Textarea name="description" value={form.description} onChange={handleInputChange} rows={6} />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-base font-medium mb-2">About Listing</label>
                    <Textarea name="aboutListing" value={form.aboutListing} onChange={handleInputChange} rows={6} />
                    {errors.aboutListing && <p className="text-red-500 text-sm mt-1">{errors.aboutListing}</p>}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-span-1 space-y-6 border">
            {isLoading ? (
              <div className="p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
              </div>
            ) : (
              <>
                <div className="p-6">
                  <label className="block text-base font-medium mb-3">Thumbnail</label>
                  <div className="border-2 border-dashed rounded h-[414px] p-8 text-center relative">
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Drag and drop or click to upload images</p>
                    <div className="flex flex-wrap gap-2 mt-4 absolute bottom-4 left-4 right-4">
                      {images.map((img, i) => (
                        <div key={i} className="relative w-12 h-12">
                          {/* next/image requires domain config for remote images; if not configured, use <img /> */}
                          <Image src={img.url} alt={`img-${i}`} width={1000} height={1000} className="w-12 h-12 object-cover rounded" />
                          <button type="button" onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <label className="block text-base font-medium mb-3">Videos</label>
                  <div className="border-2 border-dashed rounded h-[414px] p-8 text-center relative">
                    <input type="file" accept="video/*" multiple onChange={handleVideoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Play className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Drag and drop or click to upload videos</p>
                    <div className="flex flex-wrap gap-2 mt-4 absolute bottom-4 left-4 right-4">
                      {videos.map((v, i) => (
                        <div key={i} className="relative w-12 h-12">
                          <video src={v.url} className="w-12 h-12 object-cover rounded" />
                          <button type="button" onClick={() => removeVideo(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-10 pb-2">
          <Button className="bg-[#0F3D61] hover:bg-[#0F3D61]/90 h-[48px] rounded-[8px] text-white px-8" onClick={handlePublish} disabled={isSubmitting || isLoading }>
            {isSubmitting  ? "Updating..." : "Update"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditApartment;
