#!/usr/bin/env python3
import json
import sys

try:
    import pandas as pd
    from prophet import Prophet
except ModuleNotFoundError as exc:
    sys.stderr.write(f"Prophet dependencies unavailable: {exc}\n")
    sys.exit(1)


def main():
    try:
        payload = sys.stdin.read()
        data = json.loads(payload or '{}')
        series = data.get('series') or []
        periods = int(data.get('periods', 6))

        if not series:
            print(json.dumps([]))
            return

        frame = pd.DataFrame(series)
        if 'period' not in frame.columns or 'total' not in frame.columns:
            raise ValueError('Series must include "period" and "total" keys.')

        frame['ds'] = pd.to_datetime(frame['period'] + '-01')
        frame['y'] = frame['total']

        model = Prophet()
        model.fit(frame[['ds', 'y']])

        future = model.make_future_dataframe(periods=periods, freq='MS')
        forecast = model.predict(future.tail(periods))

        response = []
        for _, row in forecast.iterrows():
            response.append({
                'period': row['ds'].strftime('%Y-%m'),
                'projected': round(float(row['yhat']), 2),
                'confidence': {
                    'lower': round(float(row['yhat_lower']), 2),
                    'upper': round(float(row['yhat_upper']), 2)
                }
            })

        print(json.dumps(response))
    except Exception as exc:  # pylint: disable=broad-except
        sys.stderr.write(str(exc))
        sys.exit(1)


if __name__ == '__main__':
    main()
