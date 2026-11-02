/**
 * Yalidine API v1 shapes, written from the public documentation and open-source clients
 * (docs/carriers.md). Not yet checked against a sandbox: confirm field names with recorded
 * responses before going live.
 */
export interface YalidinePage<T> {
  readonly has_more: boolean;
  readonly total_data: number;
  readonly data: readonly T[];
}

export interface YalidineParcelInput {
  readonly order_id: string;
  readonly from_wilaya_name: string;
  readonly firstname: string;
  readonly familyname: string;
  readonly contact_phone: string;
  readonly address: string;
  readonly to_commune_name: string;
  readonly to_wilaya_name: string;
  readonly product_list: string;
  readonly price: number;
  readonly do_insurance: boolean;
  readonly declared_value: number;
  readonly height: number;
  readonly width: number;
  readonly length: number;
  readonly weight: number;
  readonly freeshipping: boolean;
  readonly is_stopdesk: boolean;
  readonly stopdesk_id?: string;
  readonly has_exchange: boolean;
}

export interface YalidineCreateResult {
  readonly success: boolean;
  readonly order_id: string;
  readonly tracking: string | null;
  readonly label: string | null;
  readonly message: string;
}

export interface YalidineParcel {
  readonly tracking: string;
  readonly order_id: string;
  readonly label: string | null;
  readonly last_status: string;
}

export interface YalidineHistory {
  readonly date_status: string;
  readonly tracking: string;
  readonly status: string;
  readonly reason: string | null;
  readonly center_name: string | null;
  readonly commune_name: string | null;
  readonly wilaya_name: string | null;
}

export interface YalidineCenter {
  readonly center_id: number;
  readonly name: string;
  readonly address: string;
  readonly commune_name: string;
  readonly wilaya_id: number;
}
