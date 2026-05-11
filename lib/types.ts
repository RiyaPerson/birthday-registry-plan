export interface Profile {
  id: string
  display_name: string
  birthday: string | null
  avatar_url: string | null
  created_at: string
}

export interface Registry {
  id: string
  user_id: string
  title: string
  slug: string
  description: string | null
  event_date: string
  cover_image_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface RegistryItem {
  id: string
  registry_id: string
  title: string
  description: string | null
  desired_quantity: number
  priority: number
  custom_url: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface ProductOption {
  id: string
  item_id: string
  title: string
  url: string
  price_cents: number | null
  currency: string
  retailer: string | null
  image_url: string | null
  created_at: string
}

export interface GiftClaim {
  id: string
  item_id: string
  product_option_id: string | null
  quantity: number
  claimer_name: string | null
  claimer_email: string | null
  message: string | null
  claimed_at: string
}

export interface RegistryItemWithDetails extends RegistryItem {
  product_options: ProductOption[]
  gift_claims: GiftClaim[]
  claimed_quantity: number
}

export interface RegistryWithItems extends Registry {
  items: RegistryItemWithDetails[]
  profile?: Profile
}
