import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

out_dir = r"D:\Yuvraj_Zitus_Capstone_Projects\FS-01\deliverables\screenshots"
os.makedirs(out_dir, exist_ok=True)

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1440,960")
opts.add_argument("--disable-gpu")
opts.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=opts)

try:
    print("Capturing 01_storefront_hero.png...")
    driver.get("http://localhost:5173/")
    time.sleep(3)
    driver.save_screenshot(os.path.join(out_dir, "01_storefront_hero.png"))

    print("Capturing 02_catalog_showcase.png...")
    driver.execute_script("window.scrollTo(0, 600);")
    time.sleep(1)
    driver.save_screenshot(os.path.join(out_dir, "02_catalog_showcase.png"))

    print("Capturing 03_product_detail_buybox.png...")
    driver.get("http://localhost:5173/product/6aff16c42a2783e9304863a1")
    time.sleep(2)
    driver.save_screenshot(os.path.join(out_dir, "03_product_detail_buybox.png"))

    print("Capturing 04_cart_drawer.png...")
    # Click Add to Cart button if present
    try:
        add_btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'Add to Cart') or contains(text(), 'Add to Bag')]")
        if add_btns:
            add_btns[0].click()
            time.sleep(1.5)
    except Exception as e:
        print("Add to cart click error:", e)
    driver.save_screenshot(os.path.join(out_dir, "04_cart_drawer.png"))

    print("Capturing 05_order_tracking.png...")
    # Switch to customer
    driver.get("http://localhost:5173/")
    time.sleep(1)
    try:
        cust_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Customer')]")
        cust_btn.click()
        time.sleep(1)
    except Exception as e:
        print("Customer switch error:", e)
    driver.get("http://localhost:5173/orders")
    time.sleep(2)
    driver.save_screenshot(os.path.join(out_dir, "05_order_tracking.png"))

    print("Capturing 06_vendor_central.png...")
    driver.get("http://localhost:5173/")
    time.sleep(1)
    try:
        maker_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Maker')]")
        maker_btn.click()
        time.sleep(1)
    except Exception as e:
        print("Maker switch error:", e)
    driver.get("http://localhost:5173/vendor/dashboard")
    time.sleep(2)
    driver.save_screenshot(os.path.join(out_dir, "06_vendor_central.png"))

    print("Capturing 07_admin_analytics.png...")
    driver.get("http://localhost:5173/")
    time.sleep(1)
    try:
        admin_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Admin')]")
        admin_btn.click()
        time.sleep(1)
    except Exception as e:
        print("Admin switch error:", e)
    driver.get("http://localhost:5173/admin/dashboard")
    time.sleep(2)
    driver.save_screenshot(os.path.join(out_dir, "07_admin_analytics.png"))

    print("All FS-01 screenshots captured successfully!")

finally:
    driver.quit()
