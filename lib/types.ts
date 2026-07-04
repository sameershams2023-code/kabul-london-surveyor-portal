export type Role = 'owner' | 'admin' | 'manager' | 'surveyor' | 'office_agent';

export type Surveyor = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  tidycal_link: string | null;
  service_area: string | null;
  active: boolean;
  created_at: string;
};

export type Lead = {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  property_address: string;
  postcode: string;
  service_type: string;
  source: string | null;
  current_status: string;
  assigned_surveyor_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  surveyors?: Pick<Surveyor, 'full_name' | 'email' | 'tidycal_link'> | null;
};

export type Note = {
  id: string;
  lead_id: string;
  user_id: string;
  note: string;
  created_at: string;
};

export type SmsMessage = {
  id: string;
  lead_id: string;
  surveyor_id: string | null;
  recipient_phone: string;
  message_body: string;
  yay_message_id: string | null;
  delivery_status: string | null;
  sent_by: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  lead_id: string;
  surveyor_id: string | null;
  tidycal_booking_id: string | null;
  booking_time: string | null;
  booking_status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
  leads?: Pick<Lead, 'id' | 'customer_name' | 'phone' | 'property_address' | 'postcode' | 'service_type'> | null;
};

export type LeadStatusHistory = {
  id: string;
  lead_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
  leads?: Pick<Lead, 'customer_name' | 'property_address' | 'postcode'> | null;
  changed_by_surveyor?: Pick<Surveyor, 'full_name' | 'email'> | null;
  changed_by_email?: string | null;
};
