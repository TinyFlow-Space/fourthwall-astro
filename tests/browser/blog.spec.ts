import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { transform } from "esbuild";

test("blog renders its empty/error state; invalid slug is a 404", async ({
  page,
}) => {
  const response = await page.goto("/blog");
  expect([200, 503]).toContain(response?.status());
  if (response?.status() === 503) {
    await expect(
      page.getByRole("heading", {
        name: "The blog is temporarily unavailable",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Try again", exact: true }),
    ).toBeVisible();
  } else {
    await expect(page.locator("[data-blog-results]")).toBeVisible();
  }
  const missing = await page.goto("/blog/invalid/slug");
  expect(missing?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Article not found" }),
  ).toBeVisible();
});

test("debounce, cache, filters, stale requests, retry, clearing and history", async ({
  page,
}) => {
  const script = (
    await transform(readFileSync("src/scripts/blog/listing.ts", "utf8"), {
      loader: "ts",
    })
  ).code;
  const requests: string[] = [];
  let fail = false;
  const result = (pageNumber: number, query = "", category = "") =>
    `<div data-blog-results data-page="${pageNumber}" data-q="${query}" data-category="${category}" data-tag=""><p data-result-count>Results ${query} page ${pageNumber}</p><a data-page-link href="/blog?page=${pageNumber === 1 ? 2 : 1}">Go page ${pageNumber === 1 ? 2 : 1}</a></div>`;
  await page.route("**/blog*", async (route) => {
    const url = new URL(route.request().url());
    if (!url.searchParams.has("fragment")) {
      await route.fulfill({
        contentType: "text/html",
        body: `<section data-blog-listing><form><input name="q" aria-label="Search posts"><div data-filter-buttons><a role="button" data-value="" aria-pressed="true" href="/blog">Latest</a><a role="button" data-value="design" aria-pressed="false" href="/blog?category=design">Design</a></div><input type="hidden" name="category"><input type="hidden" name="tag"><button>Search</button><a href="/blog" data-reset>Clear all</a></form><p data-loading-status role="status"></p><div data-results-shell><div hidden data-skeleton>Loading</div>${result(1)}</div></section>`,
      });
    } else {
      requests.push(url.search);
      const q = url.searchParams.get("q") ?? "";
      await new Promise((resolve) =>
        setTimeout(resolve, q === "slow" ? 700 : 80),
      );
      await route
        .fulfill({
          status: fail ? 503 : 200,
          contentType: "text/html",
          body: result(
            Number(url.searchParams.get("page") ?? 1),
            q,
            url.searchParams.get("category") ?? "",
          ),
        })
        .catch(() => {});
    }
  });
  await page.goto("/blog");
  await page.addScriptTag({ content: script });
  await page.getByText("Go page 2").click();
  await expect(page.locator("[data-result-count]")).toHaveText(
    "Results  page 2",
  );
  await page.getByText("Go page 1").click();
  await expect(page.locator("[data-result-count]")).toHaveText(
    "Results  page 1",
  );
  expect(requests).toHaveLength(1);
  const input = page.getByRole("textbox", { name: "Search posts" });
  await input.pressSequentially("design", { delay: 40 });
  await expect(page.locator("[data-result-count]")).toHaveText(
    "Results design page 1",
  );
  expect(requests).toHaveLength(2);
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Design", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/category=design/);
  expect(requests.at(-1)).toContain("q=design");
  await input.fill("slow");
  await page.waitForTimeout(350);
  await input.fill("fast");
  await expect(page.locator("[data-result-count]")).toHaveText(
    "Results fast page 1",
  );
  await page.waitForTimeout(500);
  await expect(page.locator("[data-result-count]")).toHaveText(
    "Results fast page 1",
  );
  fail = true;
  await input.fill("failure");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.locator("[data-result-count]")).toHaveText(
    "Results fast page 1",
  );
  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("[data-result-count]")).toHaveText(
    "Results failure page 1",
  );
  await page.getByText("Clear all").click();
  await expect(input).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Latest", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-result-count]")).toHaveText(
    "Results  page 1",
  );
  await page.goBack();
  await expect(input).toHaveValue("failure");
  await expect(page.locator("[data-result-count]")).toHaveText(
    "Results failure page 1",
  );
});

test("category breadcrumb URLs survive direct loads, refresh and history with existing tabs", async ({
  page,
}) => {
  await page.goto("/blog?category=featured");
  const featured = page.getByRole("button", { name: "Featured", exact: true });
  const latest = page.getByRole("button", { name: "Latest", exact: true });
  await expect(featured).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-blog-results]")).toHaveAttribute(
    "data-category",
    "featured",
  );
  await page.reload();
  await expect(featured).toHaveAttribute("aria-pressed", "true");
  await latest.click();
  await expect(latest).toHaveAttribute("aria-pressed", "true");
  await expect(page).not.toHaveURL(/category=/);
  await page.goBack();
  await expect(featured).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-blog-results]")).toHaveAttribute(
    "data-category",
    "featured",
  );
  await page.goForward();
  await expect(latest).toHaveAttribute("aria-pressed", "true");
  await page.goto("/blog?category=not-a-real-category&page=9999");
  await expect(latest).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-blog-results]")).toHaveAttribute(
    "data-page",
    "1",
  );
  await expect(page).not.toHaveURL(/category=/);
});

test("category links work without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/blog?category=featured`, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: "Featured", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Latest", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Latest", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page).not.toHaveURL(/category=/);
  await context.close();
});

test("featured article breadcrumb returns to the selected category tab", async ({
  page,
}) => {
  await page.goto("/blog?category=featured");
  const article = page
    .locator('[data-blog-results] .blog-card a[href^="/blog/"]')
    .first();
  test.skip(
    (await article.count()) === 0,
    "No featured article is published in this dataset.",
  );
  await article.click();
  await page
    .locator('article a[href="/blog?category=featured"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/blog\?category=featured$/);
  await expect(
    page.getByRole("button", { name: "Featured", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("real pagination uses the current page and disables unavailable directions", async ({
  page,
}) => {
  await page.goto("/blog");
  const nav = page.getByRole("navigation", { name: "Blog pagination" });
  test.skip(
    (await nav.count()) === 0,
    "No posts are published in this dataset.",
  );
  await expect(nav.getByLabel("Previous Page")).toBeDisabled();
  await expect(nav.locator('[aria-current="page"]')).toHaveText("1");
  if (
    (await nav.getByLabel("Next Page").getAttribute("aria-disabled")) === "true"
  ) {
    await expect(nav.getByLabel("Next Page")).toBeDisabled();
  } else {
    await nav.getByLabel("Next Page").click();
    await expect(page.locator("[data-blog-results]")).toHaveAttribute(
      "data-page",
      "2",
    );
    await expect(nav.locator('[aria-current="page"]')).toHaveText("2");
  }
});
