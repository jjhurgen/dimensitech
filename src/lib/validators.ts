import { z } from "zod";

export const providerSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  dniRuc: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  observation: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});

export const customerSchema = z.object({
  dni: z.string().optional(),
  firstNames: z.string().min(2, "Nombres requeridos"),
  lastNames: z.string().min(2, "Apellidos requeridos"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  observation: z.string().optional()
});

export const productSkuSchema = z.object({
  skuCode: z.string().min(2),
  productTypeId: z.coerce.number().positive(),
  imageId: z.coerce.number().optional().nullable(),
  brand: z.string().min(1),
  name: z.string().min(1),
  commercialModel: z.string().optional(),
  platform: z.enum(["ANDROID", "IPHONE"]).optional().nullable(),
  color: z.string().optional(),
  storage: z.string().optional(),
  ram: z.string().optional(),
  condition: z.enum(["NEW_SEALED", "REFURBISHED", "OPEN_BOX", "USED"]).default("NEW_SEALED"),
  modelNumber: z.string().optional(),
  shortDescription: z.string().optional(),
  suggestedSalePrice: z.coerce.number().min(0),
  visibleInStore: z.coerce.boolean().default(false),
  availableOnRequest: z.coerce.boolean().default(false),
  requestDeliveryDays: z.coerce.number().int().min(1).max(30).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});

export const purchaseSchema = z.object({
  providerId: z.coerce.number().positive("Proveedor requerido"),
  purchaseDate: z.coerce.date(),
  freightAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productSkuId: z.coerce.number().positive(),
      quantity: z.coerce.number().int().positive(),
      unitPurchasePrice: z.coerce.number().min(0),
      phones: z
        .array(
          z.object({
            imei1: z.string().min(5),
            imei2: z.string().min(5),
            serialNumber: z.string().optional(),
            modelNumber: z.string().optional(),
            modelNumber2: z.string().optional(),
            whiteListRegistered: z.coerce.boolean().default(false)
          })
        )
        .optional()
    })
  ).min(1)
});

export const saleSchema = z.object({
  customerId: z.coerce.number().positive("Cliente requerido").optional().nullable(),
  customerDocumentType: z.enum(["DNI", "CE", "RUC"]).default("DNI"),
  customerDocumentNumber: z.string().min(8, "Documento requerido"),
  customerFullName: z.string().min(2, "Cliente requerido"),
  saleDate: z.coerce.date(),
  saleChannel: z.enum(["STORE", "WEB", "WHATSAPP", "DELIVERY"]),
  paymentMethod: z.enum(["CASH", "YAPE", "PLIN", "TRANSFER", "CARD", "MIXED"]),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productSkuId: z.coerce.number().positive(),
      phoneUnitId: z.coerce.number().optional().nullable(),
      itemType: z.enum(["PHONE", "ACCESSORY"]),
      quantity: z.coerce.number().int().positive(),
      unitSalePrice: z.coerce.number().min(0),
      discount: z.coerce.number().min(0).default(0),
      isGift: z.coerce.boolean().default(false)
    }).refine((item) => item.isGift || item.unitSalePrice > 0, {
      message: "Precio 0 solo permitido en regalos",
      path: ["unitSalePrice"]
    })
  ).min(1)
});

export const reservationSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  customerDni: z.string().optional(),
  shippingType: z.enum(["LIMA", "PROVINCE", "STORE_PICKUP", "DELIVERY"]),
  destinationDepartment: z.string().optional(),
  destinationProvince: z.string().optional(),
  destinationCity: z.string().optional(),
  addressReference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productSkuId: z.coerce.number().positive(),
      quantityRequested: z.coerce.number().int().positive(),
      unitPrice: z.coerce.number().min(0),
      originalUnitPrice: z.coerce.number().min(0).optional().nullable(),
      discountUnitAmount: z.coerce.number().min(0).optional().nullable(),
      discountLabel: z.string().optional().nullable(),
      discountCampaignName: z.string().optional().nullable()
    })
  ).min(1)
}).refine((data) => data.shippingType !== "LIMA" || !!data.destinationCity, {
  message: "Distrito requerido para envio a Lima",
  path: ["destinationCity"]
}).refine((data) => data.shippingType !== "LIMA" || !!data.addressReference, {
  message: "Direccion requerida para envio a Lima",
  path: ["addressReference"]
}).refine((data) => data.shippingType !== "PROVINCE" || !!data.destinationDepartment, {
  message: "Departamento requerido para provincia",
  path: ["destinationDepartment"]
}).refine((data) => data.shippingType !== "PROVINCE" || !!data.destinationProvince, {
  message: "Provincia requerida para provincia",
  path: ["destinationProvince"]
}).refine((data) => data.shippingType !== "PROVINCE" || !!data.destinationCity, {
  message: "Ciudad requerida para provincia",
  path: ["destinationCity"]
}).refine((data) => data.shippingType !== "PROVINCE" || !!data.addressReference, {
  message: "Direccion requerida para provincia",
  path: ["addressReference"]
}).refine((data) => data.shippingType !== "DELIVERY" || !!data.addressReference, {
  message: "Direccion requerida para delivery",
  path: ["addressReference"]
});
