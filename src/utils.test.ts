import test from "node:test";
import assert from "node:assert/strict";

import {
  updateFileExtension,
  getExtensionFromURL,
  getRemoteFilename,
} from "./utils.ts";

test("updateFileExtension - no original extension", () => {
  const newPath = updateFileExtension("test", "test.zip");
  assert.equal(newPath, "test.zip");
});

test("updateFileExtension - works with paths", () => {
  const newPath = updateFileExtension("/hello/world/test", "test.zip");
  assert.equal(newPath, "/hello/world/test.zip");
});

test("updateFileExtension - works compound extensions from header", () => {
  const newPath = updateFileExtension("/hello/world/test", "test.tar.gz");
  assert.equal(newPath, "/hello/world/test.tar.gz");
});

test("updateFileExtension - works compound extensions from source", () => {
  const newPath = updateFileExtension("/hello/world/test.tar.gz", "test.zip");
  assert.equal(newPath, "/hello/world/test.zip");
});

test("getExtensionFromURL - works with no extension", () => {
  const extension = getExtensionFromURL("https://example.com/test");
  assert.equal(extension, undefined);
});

test("getExtensionFromURL - works with .zip", () => {
  const extension = getExtensionFromURL("https://example.com/test.zip");
  assert.equal(extension, ".zip");
});

test("getExtensionFromURL - works with .tar.gz", () => {
  const extension = getExtensionFromURL("https://example.com/test.tar.gz");
  assert.equal(extension, ".tar.gz");
});

test("getRemoteFilename - works with an unquoted filename", () => {
  const resp = new Response();
  resp.headers.set("content-disposition", "attachment; filename=test.zip");

  const filename = getRemoteFilename(resp);
  assert.equal(filename, "test.zip");
});

test("getRemoteFilename - works with a quoted filename", () => {
  const resp = new Response();
  resp.headers.set(
    "content-disposition",
    'attachment; filename="50bfbeee-6452-4a9e-af9e-2e568e56a8bc.tar.gz"'
  );

  const filename = getRemoteFilename(resp);
  assert.equal(filename, "50bfbeee-6452-4a9e-af9e-2e568e56a8bc.tar.gz");
});
