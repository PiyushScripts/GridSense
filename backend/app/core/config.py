from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "Smart Electricity Monitoring API"
    default_threshold_kw: float = 1.5
    default_sampling_rate_ms: int = 2000
    segment_count: int = 3


settings = Settings()
