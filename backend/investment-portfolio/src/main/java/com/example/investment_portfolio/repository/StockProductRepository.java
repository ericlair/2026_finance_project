package com.example.investment_portfolio.repository;

import com.example.investment_portfolio.entity.StockProduct;
import com.example.investment_portfolio.logic.CategoryType;
import com.example.investment_portfolio.logic.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockProductRepository extends JpaRepository<StockProduct, Long> {

    List<StockProduct> findByCategory(ProductCategory category);

    List<StockProduct> findByCategoryType(CategoryType categoryType);

    List<StockProduct> findByCategoryTypeIn(java.util.Collection<CategoryType> categoryTypes);
}