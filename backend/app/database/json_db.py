"""Local JSON-file database adapter for demo mode.
Provides a MongoDB-like async interface for users and assessments without needing MongoDB installed.
"""

import os
import json
import asyncio
from bson import ObjectId
from typing import Optional, Dict, Any, List


class JSONCollection:
    def __init__(self, filename: str, lock: asyncio.Lock):
        self.filename = filename
        self.lock = lock
        self._ensure_file()

    def _ensure_file(self):
        os.makedirs(os.path.dirname(self.filename), exist_ok=True)
        if not os.path.exists(self.filename):
            with open(self.filename, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read_data(self) -> List[Dict[str, Any]]:
        try:
            with open(self.filename, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_data(self, data: List[Dict[str, Any]]):
        with open(self.filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        async with self.lock:
            data = self._read_data()
            for doc in data:
                match = True
                for k, v in query.items():
                    doc_val = doc.get(k)
                    if k == "_id":
                        doc_val = str(doc_val)
                        v = str(v)
                    if doc_val != v:
                        match = False
                        break
                if match:
                    # Return copy with ObjectId-compatible _id
                    res = dict(doc)
                    res["_id"] = ObjectId(res["_id"]) if ObjectId.is_valid(str(res["_id"])) else str(res["_id"])
                    return res
            return None

    async def insert_one(self, doc: Dict[str, Any]):
        async with self.lock:
            data = self._read_data()
            doc_to_save = dict(doc)
            if "_id" not in doc_to_save:
                new_id = str(ObjectId())
                doc_to_save["_id"] = new_id
            else:
                doc_to_save["_id"] = str(doc_to_save["_id"])
                new_id = doc_to_save["_id"]

            data.append(doc_to_save)
            self._write_data(data)

            class InsertResult:
                inserted_id = ObjectId(new_id)

            return InsertResult()

    def find(self, query: Dict[str, Any] = None):
        return JSONCursor(self, query or {})

    async def delete_one(self, query: Dict[str, Any]):
        async with self.lock:
            data = self._read_data()
            idx_to_del = -1
            for i, doc in enumerate(data):
                match = True
                for k, v in query.items():
                    doc_val = doc.get(k)
                    if k == "_id":
                        doc_val = str(doc_val)
                        v = str(v)
                    if doc_val != v:
                        match = False
                        break
                if match:
                    idx_to_del = i
                    break
            if idx_to_del >= 0:
                data.pop(idx_to_del)
                self._write_data(data)
                deleted_count = 1
            else:
                deleted_count = 0

            class DeleteResult:
                deleted_count = deleted_count

            return DeleteResult()

    async def aggregate(self, pipeline: List[Dict[str, Any]]):
        async with self.lock:
            data = self._read_data()
            # Simple match + group for dashboard stats
            matched = data
            for stage in pipeline:
                if "$match" in stage:
                    q = stage["$match"]
                    matched = [d for d in matched if all(d.get(k) == v for k, v in q.items())]
                elif "$group" in stage:
                    if not matched:
                        return JSONCursorFromList([])
                    total = len(matched)
                    scores = [d.get("score", {}).get("total", 0) for d in matched]
                    waters = [d.get("calculation", {}).get("harvestable_litres", 0) for d in matched]
                    avg_score = sum(scores) / total if total > 0 else 0
                    total_water = sum(waters)
                    return JSONCursorFromList([{
                        "_id": None,
                        "total": total,
                        "avg_score": avg_score,
                        "total_water": total_water,
                    }])
            return JSONCursorFromList(matched)


class JSONCursor:
    def __init__(self, collection: JSONCollection, query: Dict[str, Any]):
        self.collection = collection
        self.query = query
        self._sort_key = None
        self._sort_dir = 1
        self._limit_val = None

    def sort(self, key: str, direction: int = 1):
        self._sort_key = key
        self._sort_dir = direction
        return self

    def limit(self, val: int):
        self._limit_val = val
        return self

    async def to_list(self, length: Optional[int] = None):
        results = []
        async for doc in self:
            results.append(doc)
            if length and len(results) >= length:
                break
        return results

    def __aiter__(self):
        data = self.collection._read_data()
        filtered = []
        for doc in data:
            match = True
            for k, v in self.query.items():
                doc_val = doc.get(k)
                if k == "_id":
                    doc_val = str(doc_val)
                    v = str(v)
                if doc_val != v:
                    match = False
                    break
            if match:
                res = dict(doc)
                res["_id"] = ObjectId(res["_id"]) if ObjectId.is_valid(str(res["_id"])) else str(res["_id"])
                filtered.append(res)

        if self._sort_key:
            filtered.sort(
                key=lambda x: x.get(self._sort_key, ""),
                reverse=(self._sort_dir == -1)
            )

        if self._limit_val:
            filtered = filtered[:self._limit_val]

        self._iter_data = iter(filtered)
        return self

    async def __anext__(self):
        try:
            return next(self._iter_data)
        except StopIteration:
            raise StopAsyncIteration


class JSONCursorFromList:
    def __init__(self, items: List[Dict[str, Any]]):
        self.items = items
        self.iter_items = iter(items)

    async def to_list(self, length: Optional[int] = None):
        if length is not None:
            return self.items[:length]
        return self.items

    def __aiter__(self):
        self.iter_items = iter(self.items)
        return self

    async def __anext__(self):
        try:
            return next(self.iter_items)
        except StopIteration:
            raise StopAsyncIteration


class JSONDatabase:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.lock = asyncio.Lock()
        self.users = JSONCollection(os.path.join(data_dir, "users.json"), self.lock)
        self.assessments = JSONCollection(os.path.join(data_dir, "assessments.json"), self.lock)
