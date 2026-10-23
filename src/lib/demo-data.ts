export type ListingImage = { id: string; altText: string | null };
export type Listing = { id:string; title:string; location:string; type:string; unit:string; monthly:number; term:number; bedrooms:number; baths:number; status:string; description:string; features:string[]; images: ListingImage[] };

export const listings: Listing[] = [
 {id:"ocean-view-a2",title:"Ocean View Apartments",location:"Masaki, Dar es Salaam",type:"Residential",unit:"Apartment A2",monthly:850000,term:6,bedrooms:2,baths:2,status:"Available",description:"A bright two-bedroom apartment with secure access, balcony space and reliable property support.",features:["Secure parking","Balcony","Water reserve","24/7 security"],images:[]},
 {id:"mbezi-b4",title:"Mbezi Garden Residences",location:"Mbezi Beach, Dar es Salaam",type:"Residential",unit:"Apartment B4",monthly:650000,term:3,bedrooms:2,baths:1,status:"Available",description:"Comfortable residential unit in a quiet compound with direct access to main roads and essential services.",features:["Parking","Fenced compound","Near transport","Backup water"],images:[]},
 {id:"kariakoo-s12",title:"Kariakoo Trade Centre",location:"Kariakoo, Dar es Salaam",type:"Commercial",unit:"Shop S12",monthly:1200000,term:6,bedrooms:0,baths:1,status:"Available",description:"Street-facing commercial space suitable for retail operations with high pedestrian activity.",features:["Street frontage","Storage","Security","Business access"],images:[]}
];

export const dashboard = {
 properties:12, units:46, occupied:37, listed:6, renewal:4, grace:2, paymentExceptions:3, maintenance:5,
 revenue:"TZS 21.8M", collection:"91%"
};

export const properties = [
 {name:"Ocean View Apartments",location:"Masaki",units:8,occupied:7,listed:1,supervisor:"Asha M."},
 {name:"Mbezi Garden Residences",location:"Mbezi Beach",units:12,occupied:10,listed:2,supervisor:"Kelvin J."},
 {name:"Kariakoo Trade Centre",location:"Kariakoo",units:14,occupied:12,listed:2,supervisor:"Neema S."},
 {name:"Palm Court",location:"Mikocheni",units:12,occupied:8,listed:1,supervisor:"—"}
];

export const leases = [
 {tenant:"Rehema K.",unit:"Ocean View · A2",status:"Renewal window",end:"06 Nov 2026",amount:"TZS 5,100,000"},
 {tenant:"Daniel M.",unit:"Mbezi Garden · B4",status:"Active",end:"21 Dec 2026",amount:"TZS 1,950,000"},
 {tenant:"Grace N.",unit:"Kariakoo · S12",status:"Grace",end:"20 Oct 2026",amount:"TZS 7,200,000"},
 {tenant:"John P.",unit:"Palm Court · C7",status:"Awaiting payment",end:"—",amount:"TZS 2,400,000"}
];

export const payments = [
 {reference:"RF-PAY-10482",tenant:"Rehema K.",amount:"TZS 5,100,000",status:"Pending",provider:"Snippe"},
 {reference:"RF-PAY-10477",tenant:"Daniel M.",amount:"TZS 1,950,000",status:"Confirmed",provider:"Snippe"},
 {reference:"RF-PAY-10461",tenant:"Grace N.",amount:"TZS 6,800,000",status:"Exception",provider:"Snippe"}
];

export const maintenance = [
 {title:"Water pressure is low",property:"Ocean View Apartments",tenant:"Rehema K.",priority:"Medium",status:"Assigned"},
 {title:"Shop shutter jammed",property:"Kariakoo Trade Centre",tenant:"Grace N.",priority:"High",status:"In progress"},
 {title:"Corridor light fault",property:"Palm Court",tenant:"John P.",priority:"Low",status:"Reported"}
];
